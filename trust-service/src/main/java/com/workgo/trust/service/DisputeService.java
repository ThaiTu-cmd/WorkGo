package com.workgo.trust.service;

import com.workgo.trust.dto.request.*;
import com.workgo.trust.dto.request.client.EscrowFreezeRequest;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.dto.response.client.InternalOrderTrustSnapshot;
import com.workgo.trust.entity.Dispute;
import com.workgo.trust.entity.OnsiteIncident;
import com.workgo.trust.entity.OnsiteProgressNotice;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.exception.*;
import com.workgo.trust.mapper.DisputeMapper;
import com.workgo.trust.repository.DisputeRepository;
import com.workgo.trust.repository.OnsiteIncidentRepository;
import com.workgo.trust.repository.OnsiteProgressNoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DisputeService {
    private final DisputeRepository repository;
    private final OnsiteIncidentRepository onsiteIncidents;
    private final OnsiteProgressNoticeRepository progressNotices;
    private final DisputeMapper mapper;
    private final TrustOrderAccess orders;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;

    @Value("${app.dispute.window-days:14}")
    private int windowDays;

    public DisputeDto create(DisputeCreateReq req, UUID user, UUID provider) {
        var order = orders.snapshot(req.orderId());
        boolean client = orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        if (!Set.of("CONFIRMED", "IN_PROGRESS", "DELIVERED", "COMPLETED").contains(order.orderStatus())
                || "COMPLETED".equals(order.orderStatus()) && Instant.now().isAfter(orders.expires(order, windowDays)))
            throw new AppException(ErrorCode.ORDER_NOT_DISPUTABLE);
        TrustSupport.evidence(req.evidenceUrl());
        try {
            return transactions.locked(List.of("order:" + req.orderId()), () -> {
                if (repository.findByOrderIdAndActiveSlot(req.orderId(), 1).isPresent())
                    throw new AppException(ErrorCode.DISPUTE_ALREADY_ACTIVE);
                var d = openDisputeInternal(order, user, client, req.reason(), req.description(), req.evidenceUrl());
                return mapper.toDto(d);
            });
        } catch (DataIntegrityViolationException e) {
            if (repository.findByOrderIdAndActiveSlot(req.orderId(), 1).isPresent())
                throw new AppException(ErrorCode.DISPUTE_ALREADY_ACTIVE);
            throw e;
        }
    }

    public DisputeDto cancel(UUID id, DisputeCancelReq req, UUID user) {
        var existing = repository.findById(id).orElseThrow(DisputeNotFoundException::new);
        return transactions.locked(List.of("order:" + existing.getOrderId()), () -> {
            var d = repository.findById(id).orElseThrow(DisputeNotFoundException::new);
            if (!d.getOpenedBy().equals(user)) throw new AppException(ErrorCode.UNAUTHORIZED);
            if (d.getStatus() != DisputeStatus.OPEN) throw new AppException(ErrorCode.DISPUTE_CANNOT_CANCEL);
            d.setStatus(DisputeStatus.CANCELLED);
            d.setResolvedAt(Instant.now());
            d.setResolution(req == null ? null : req.note());
            repository.saveAndFlush(d);
            if(Set.of("POST_PAYMENT","CASH_PAYMENT").contains(d.getCaseType()))return mapper.toDto(d);
            outbox.add("DISPUTE", id, "dispute.cancelled.unfreeze_escrow", new EscrowFreezeRequest(d.getOrderId(), id, "DISPUTE_WITHDRAWN"));
            outbox.add("DISPUTE", id, "dispute.timer.resume", new EscrowFreezeRequest(d.getOrderId(), id, "DISPUTE_WITHDRAWN"));
            return mapper.toDto(d);
        });
    }

    public DisputeDto get(UUID id, UUID user, UUID provider) {
        var d = repository.findById(id).orElseThrow(DisputeNotFoundException::new);
        requireParticipant(d, user, provider);
        return mapper.toDto(d);
    }

    public OnsiteIncidentDto recordOnsiteContact(OnsiteContactNoticeReq req, UUID user, UUID provider) {
        if (req == null || req.orderId() == null || req.channel() == null || req.channel().isBlank()
                || req.note() == null || req.note().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        TrustSupport.evidence(req.evidenceUrl());
        var order = requireOnsiteOrder(req.orderId());
        boolean client = orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        if (order.startedAt() != null || !Set.of("CONFIRMED", "IN_PROGRESS").contains(order.orderStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        return transactions.locked(List.of("order:" + req.orderId()), () -> {
            OnsiteIncident incident = loadOrInitIncident(order);
            Instant scheduled = requireScheduledStart(incident, order);
            Instant at = req.occurredAt() == null ? Instant.now() : req.occurredAt();
            if (at.isBefore(scheduled)) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            if (!at.isBefore(scheduled.plus(Duration.ofMinutes(15)))) {
                incident.setContactRequired(true);
                if (incident.getDisputeId() == null) {
                    incident.setStatus("CONTACT_REQUIRED");
                }
            }
            incident.setContactAttempts(incident.getContactAttempts() + 1);
            int attemptNo;
            if (client) {
                incident.setClientContactAttempts(incident.getClientContactAttempts() + 1);
                attemptNo = incident.getClientContactAttempts();
            } else {
                incident.setProviderContactAttempts(incident.getProviderContactAttempts() + 1);
                attemptNo = incident.getProviderContactAttempts();
            }
            if (incident.getFirstContactAt() == null) {
                incident.setFirstContactAt(at);
            }
            incident.setLastContactAt(at);
            onsiteIncidents.saveAndFlush(incident);

            progressNotices.saveAndFlush(OnsiteProgressNotice.builder()
                    .orderId(req.orderId())
                    .actorId(user)
                    .actorRole(client ? "CLIENT" : "PROVIDER")
                    .noticeType("CONTACT_ATTEMPT")
                    .occurredAt(at)
                    .summary(req.channel().strip() + ": " + req.note().strip())
                    .evidenceUrl(req.evidenceUrl())
                    .contactAttemptNo(attemptNo)
                    .build());

            outbox.notify(client ? null : order.clientId(), client ? order.providerId() : null,
                    "ONSITE_CONTACT_REQUIRED", "ORDER", req.orderId());
            return toIncidentDto(incident);
        });
    }

    public OnsiteIncidentDto proposeOnsiteReschedule(OnsiteRescheduleReq req, UUID user, UUID provider) {
        if (req == null || req.orderId() == null || req.proposedStart() == null || req.proposedEnd() == null
                || !req.proposedEnd().isAfter(req.proposedStart())
                || req.reason() == null || req.reason().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        var order = requireOnsiteOrder(req.orderId());
        boolean client = orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        if (!Set.of("CONFIRMED", "IN_PROGRESS").contains(order.orderStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        return transactions.locked(List.of("order:" + req.orderId()), () -> {
            OnsiteIncident incident = loadOrInitIncident(order);
            if (req.expectedVersion() != null && !Objects.equals(req.expectedVersion(), incident.getVersion())) {
                throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            }
            incident.setProposedScheduledStart(req.proposedStart());
            incident.setProposedScheduledEnd(req.proposedEnd());
            incident.setRescheduleProposedByRole(client ? "CLIENT" : "PROVIDER");
            incident.setClientConfirmedReschedule(client);
            incident.setProviderConfirmedReschedule(!client);
            incident.setRescheduleStatus("AWAITING_COUNTERPART_CONFIRMATION");
            onsiteIncidents.saveAndFlush(incident);

            progressNotices.saveAndFlush(OnsiteProgressNotice.builder()
                    .orderId(req.orderId())
                    .actorId(user)
                    .actorRole(client ? "CLIENT" : "PROVIDER")
                    .noticeType("RESCHEDULE_PROPOSED")
                    .occurredAt(Instant.now())
                    .summary(req.reason().strip())
                    .contactAttemptNo(0)
                    .build());

            return toIncidentDto(incident);
        });
    }

    public OnsiteIncidentDto confirmOnsiteReschedule(OnsiteRescheduleReq req, UUID user, UUID provider) {
        if (req == null || req.orderId() == null || req.proposedStart() == null || req.proposedEnd() == null
                || req.reason() == null || req.reason().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        var order = requireOnsiteOrder(req.orderId());
        boolean client = orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        String actorRole = client ? "CLIENT" : "PROVIDER";

        return transactions.locked(List.of("order:" + req.orderId()), () -> {
            OnsiteIncident incident = onsiteIncidents.findByOrderId(req.orderId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
            if (!"AWAITING_COUNTERPART_CONFIRMATION".equals(incident.getRescheduleStatus())
                    || Objects.equals(actorRole, incident.getRescheduleProposedByRole())) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            if ((req.expectedVersion() != null && !Objects.equals(req.expectedVersion(), incident.getVersion()))
                    || !Objects.equals(req.proposedStart(), incident.getProposedScheduledStart())
                    || !Objects.equals(req.proposedEnd(), incident.getProposedScheduledEnd())) {
                throw new AppException(ErrorCode.CONCURRENT_MODIFICATION);
            }
            incident.setClientConfirmedReschedule(true);
            incident.setProviderConfirmedReschedule(true);
            incident.setRescheduleStatus("CONFIRMED");
            incident.setEffectiveScheduledStart(incident.getProposedScheduledStart());
            incident.setEffectiveScheduledEnd(incident.getProposedScheduledEnd());
            incident.setContactRequired(false);
            incident.setContactAttempts(0);
            incident.setClientContactAttempts(0);
            incident.setProviderContactAttempts(0);
            if ("CONTACT_REQUIRED".equals(incident.getStatus())) {
                incident.setStatus("RESCHEDULED");
            }
            onsiteIncidents.saveAndFlush(incident);

            progressNotices.saveAndFlush(OnsiteProgressNotice.builder()
                    .orderId(req.orderId())
                    .actorId(user)
                    .actorRole(actorRole)
                    .noticeType("RESCHEDULE_CONFIRMED")
                    .occurredAt(Instant.now())
                    .summary(req.reason().strip())
                    .contactAttemptNo(0)
                    .build());

            return toIncidentDto(incident);
        });
    }

    public OnsiteIncidentDto reportOnsiteIncident(OnsiteIncidentReq req, UUID user, UUID provider) {
        if (req == null || req.orderId() == null || req.incidentType() == null || req.incidentType().isBlank()
                || req.description() == null || req.description().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        TrustSupport.evidence(req.evidenceUrl());
        var order = requireOnsiteOrder(req.orderId());
        boolean client = orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        if (!Set.of("CONFIRMED", "IN_PROGRESS", "DELIVERED").contains(order.orderStatus())) {
            throw new AppException(ErrorCode.ORDER_NOT_DISPUTABLE);
        }

        String type = req.incidentType().strip().toUpperCase(Locale.ROOT);
        Instant at = req.incidentAt() == null ? Instant.now() : req.incidentAt();
        boolean forceMajeure = Boolean.TRUE.equals(req.forceMajeure()) || "FORCE_MAJEURE".equals(type);

        return transactions.locked(List.of("order:" + req.orderId()), () -> {
            OnsiteIncident incident = loadOrInitIncident(order);
            Instant scheduled = requireScheduledStart(incident, order);

            switch (type) {
                case "NO_SHOW", "PROVIDER_NO_SHOW", "CLIENT_NO_SHOW" -> {
                    if (order.startedAt() != null) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                    if (at.isBefore(scheduled.plus(Duration.ofMinutes(30)))) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                    int actorContacts = client ? incident.getClientContactAttempts() : incident.getProviderContactAttempts();
                    if (actorContacts < 2) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                }
                case "SAFETY_HAZARD", "SCOPE_MISMATCH" -> {
                    if (req.evidenceUrl() == null || req.evidenceUrl().isBlank()) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                    if (!forceMajeure && at.isAfter(scheduled.plus(Duration.ofHours(24)))) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                }
                case "CANCELLATION_BEFORE_24H" -> {
                    if (order.startedAt() != null || at.isAfter(scheduled.minus(Duration.ofHours(24)))) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                }
                case "CANCELLATION_WITHIN_24H", "FORCE_MAJEURE" -> {
                    // Validated through ADMIN conclusion with fee/exemption rules.
                }
                default -> throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            Dispute dispute = repository.findByOrderIdAndActiveSlot(req.orderId(), 1)
                    .orElseGet(() -> openDisputeInternal(order, user, client,
                            "ONSITE_" + type, req.description().strip(), req.evidenceUrl()));

            String allegedParty = req.allegedFaultParty() != null && !req.allegedFaultParty().isBlank()
                    ? req.allegedFaultParty().strip().toUpperCase(Locale.ROOT)
                    : switch (type) {
                        case "CLIENT_NO_SHOW" -> "CLIENT";
                        case "PROVIDER_NO_SHOW" -> "PROVIDER";
                        case "NO_SHOW" -> client ? "PROVIDER" : "CLIENT";
                        default -> "NONE";
                    };

            incident.setIncidentType(type);
            incident.setDisputeId(dispute.getDisputeId());
            incident.setStatus("CASE_OPENED");
            incident.setAllegedFaultParty(allegedParty);
            incident.setForceMajeure(forceMajeure);
            incident.setAllegationSummary(req.description().strip());
            incident.setEvidenceUrl(req.evidenceUrl());
            incident.setLocationSignal(req.locationSignal());
            incident.setIncidentReportedAt(at);
            incident.setConclusionStatus("AWAITING_ADMIN_CONCLUSION");
            incident.setFinancialStatus("PENDING_DECISION");
            incident.setApplicableCancellationFee(0L);
            incident.setArrivalFee(0L);
            onsiteIncidents.saveAndFlush(incident);

            progressNotices.saveAndFlush(OnsiteProgressNotice.builder()
                    .orderId(req.orderId())
                    .actorId(user)
                    .actorRole(client ? "CLIENT" : "PROVIDER")
                    .noticeType("INCIDENT_REPORTED:" + type)
                    .occurredAt(at)
                    .summary(req.description().strip())
                    .evidenceUrl(req.evidenceUrl())
                    .contactAttemptNo(incident.getContactAttempts())
                    .build());

            return toIncidentDto(incident);
        });
    }

    public OnsiteIncidentDto getOnsiteIncident(UUID orderId, UUID user, UUID provider) {
        var order = requireOnsiteOrder(orderId);
        orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        OnsiteIncident incident = onsiteIncidents.findByOrderId(orderId)
                .orElseGet(() -> loadOrInitIncident(order));
        return toIncidentDto(incident);
    }

    private Dispute openDisputeInternal(
            InternalOrderTrustSnapshot order,
            UUID user,
            boolean client,
            String reason,
            String description,
            String evidenceUrl) {
        var d = repository.saveAndFlush(Dispute.builder()
                .caseType("COMPLETED".equals(order.orderStatus())&&"CASH_ON_SITE".equals(order.paymentStatus())?"CASH_PAYMENT":
                        "COMPLETED".equals(order.orderStatus())&&Set.of("RELEASED","CASH_SETTLED").contains(order.paymentStatus())?"POST_PAYMENT":"ESCROW")
                .orderId(order.orderId())
                .openedBy(user)
                .openedByRole(client ? "CLIENT" : "PROVIDER")
                .clientId(order.clientId())
                .providerId(order.providerId())
                .reason(reason)
                .description(description)
                .evidenceUrl(evidenceUrl)
                .build());
        if(!Set.of("POST_PAYMENT","CASH_PAYMENT").contains(d.getCaseType())){
        outbox.add("DISPUTE", d.getDisputeId(), "dispute.opened.freeze_escrow",
                new EscrowFreezeRequest(d.getOrderId(), d.getDisputeId(), "DISPUTE_OPENED"));
        outbox.add("DISPUTE", d.getDisputeId(), "dispute.timer.pause",
                new EscrowFreezeRequest(d.getOrderId(), d.getDisputeId(), "DISPUTE_OPENED"));
        }
        outbox.notify(client ? null : order.clientId(), client ? order.providerId() : null,
                "DISPUTE_OPENED", "DISPUTE", d.getDisputeId());
        return d;
    }

    private InternalOrderTrustSnapshot requireOnsiteOrder(UUID orderId) {
        var order = orders.snapshot(orderId);
        if (!"ONSITE".equals(order.executionType())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return order;
    }

    private OnsiteIncident loadOrInitIncident(InternalOrderTrustSnapshot order) {
        return onsiteIncidents.findByOrderId(order.orderId())
                .orElseGet(() -> {
                    Instant schedStart = order.scheduledStart() != null ? order.scheduledStart() : order.placedAt();
                    Instant schedEnd = order.scheduledEnd() != null ? order.scheduledEnd()
                            : (schedStart == null ? null : schedStart.plus(Duration.ofHours(2)));
                    return onsiteIncidents.saveAndFlush(OnsiteIncident.builder()
                            .orderId(order.orderId())
                            .clientId(order.clientId())
                            .providerId(order.providerId())
                            .status("MONITORING")
                            .originalScheduledStart(schedStart)
                            .originalScheduledEnd(schedEnd)
                            .effectiveScheduledStart(schedStart)
                            .effectiveScheduledEnd(schedEnd)
                            .rescheduleStatus("NONE")
                            .conclusionStatus("NO_CONCLUSION")
                            .financialStatus("UNCHANGED")
                            .build());
                });
    }

    private Instant requireScheduledStart(OnsiteIncident incident, InternalOrderTrustSnapshot order) {
        if (incident.getEffectiveScheduledStart() != null) {
            return incident.getEffectiveScheduledStart();
        }
        if (order.scheduledStart() != null) {
            return order.scheduledStart();
        }
        if (order.placedAt() != null) {
            return order.placedAt();
        }
        throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    private OnsiteIncidentDto toIncidentDto(OnsiteIncident incident) {
        List<ProgressNoticeDto> notices = progressNotices.findByOrderIdOrderByOccurredAtAsc(incident.getOrderId())
                .stream()
                .map(n -> new ProgressNoticeDto(
                        n.getNoticeId(),
                        n.getOrderId(),
                        n.getActorId(),
                        n.getActorRole(),
                        n.getNoticeType(),
                        n.getOccurredAt(),
                        n.getSummary(),
                        n.getEvidenceUrl(),
                        n.getContactAttemptNo()
                ))
                .toList();

        return new OnsiteIncidentDto(
                incident.getIncidentId(),
                incident.getOrderId(),
                incident.getDisputeId(),
                incident.getIncidentType(),
                incident.getStatus(),
                incident.isContactRequired(),
                incident.getContactAttempts(),
                incident.getFirstContactAt(),
                incident.getLastContactAt(),
                incident.getOriginalScheduledStart(),
                incident.getOriginalScheduledEnd(),
                incident.getEffectiveScheduledStart(),
                incident.getEffectiveScheduledEnd(),
                incident.getProposedScheduledStart(),
                incident.getProposedScheduledEnd(),
                incident.getRescheduleProposedByRole(),
                incident.isClientConfirmedReschedule(),
                incident.isProviderConfirmedReschedule(),
                incident.getRescheduleStatus(),
                incident.getAllegedFaultParty(),
                incident.isForceMajeure(),
                incident.getAllegationSummary(),
                incident.getEvidenceUrl(),
                incident.getLocationSignal(),
                incident.getIncidentReportedAt(),
                incident.getConclusionStatus(),
                incident.getDecisionId(),
                incident.getConcludedFaultParty(),
                incident.getConcludedFaultType(),
                incident.getFinancialStatus(),
                incident.getApplicableCancellationFee(),
                incident.getArrivalFee(),
                notices,
                incident.getVersion()
        );
    }

    private void requireParticipant(Dispute d, UUID user, UUID provider) {
        if (!TrustSupport.participant(d.getClientId(), d.getProviderId(), user, provider))
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    public List<DisputeDto> orderDisputes(UUID id, UUID user, UUID provider) {
        var order = orders.snapshot(id);
        orders.isClient(order, user, provider, ErrorCode.INVALID_REQUEST);
        return repository.findByOrderIdOrderByCreatedAtDesc(id).stream().map(mapper::toDto).toList();
    }

    public PageResponse<DisputeDto> myDisputes(UUID user, UUID provider, DisputeStatus status, int page, int size) {
        return TrustSupport.response(repository.findMyDisputes(user, provider, status, TrustSupport.page(page, size, "disputeId")).map(mapper::toDto));
    }
}
