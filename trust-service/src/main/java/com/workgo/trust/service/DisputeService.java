package com.workgo.trust.service;
import com.workgo.trust.dto.request.*;
import com.workgo.trust.dto.request.client.EscrowFreezeRequest;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.entity.Dispute;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.exception.*;
import com.workgo.trust.mapper.DisputeMapper;
import com.workgo.trust.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
@Service @RequiredArgsConstructor
public class DisputeService {
    private final DisputeRepository repository;
    private final DisputeMapper mapper;
    private final TrustOrderAccess orders;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;
    @Value("${app.dispute.window-days:14}") private int windowDays;
    public DisputeDto create(DisputeCreateReq req, UUID user, UUID provider) {
        var order = orders.snapshot(req.orderId());
        boolean client = orders.isClient(order,user,provider,ErrorCode.INVALID_REQUEST);
        if (!Set.of("CONFIRMED","IN_PROGRESS","DELIVERED","COMPLETED").contains(order.orderStatus())
                || "COMPLETED".equals(order.orderStatus()) && Instant.now().isAfter(orders.expires(order,windowDays))) throw new AppException(ErrorCode.ORDER_NOT_DISPUTABLE);
        TrustSupport.evidence(req.evidenceUrl());
        try {
            return transactions.locked(List.of("order:" + req.orderId()), () -> {
                if (repository.findByOrderIdAndActiveSlot(req.orderId(),1).isPresent()) throw new AppException(ErrorCode.DISPUTE_ALREADY_ACTIVE);
                var d = repository.saveAndFlush(Dispute.builder().orderId(req.orderId()).openedBy(user).openedByRole(client ? "CLIENT" : "PROVIDER")
                        .clientId(order.clientId()).providerId(order.providerId()).reason(req.reason()).description(req.description()).evidenceUrl(req.evidenceUrl()).build());
                outbox.add("DISPUTE",d.getDisputeId(),"dispute.opened.freeze_escrow",new EscrowFreezeRequest(d.getOrderId(),d.getDisputeId(),"DISPUTE_OPENED"));
                outbox.notify(client ? null : order.clientId(),client ? order.providerId() : null,"DISPUTE_OPENED","DISPUTE",d.getDisputeId());
                return mapper.toDto(d);
            });
        } catch (DataIntegrityViolationException e) {
            if (repository.findByOrderIdAndActiveSlot(req.orderId(),1).isPresent()) throw new AppException(ErrorCode.DISPUTE_ALREADY_ACTIVE);
            throw e;
        }
    }
    public DisputeDto cancel(UUID id, DisputeCancelReq req, UUID user) {
        var existing = repository.findById(id).orElseThrow(DisputeNotFoundException::new);
        return transactions.locked(List.of("order:" + existing.getOrderId()), () -> {
            var d = repository.findById(id).orElseThrow(DisputeNotFoundException::new);
            if (!d.getOpenedBy().equals(user)) throw new AppException(ErrorCode.UNAUTHORIZED);
            if (d.getStatus() != DisputeStatus.OPEN) throw new AppException(ErrorCode.DISPUTE_CANNOT_CANCEL);
            d.setStatus(DisputeStatus.CANCELLED); d.setResolvedAt(Instant.now()); d.setResolution(req == null ? null : req.note());
            repository.saveAndFlush(d);
            outbox.add("DISPUTE",id,"dispute.cancelled.unfreeze_escrow",new EscrowFreezeRequest(d.getOrderId(),id,"DISPUTE_WITHDRAWN"));
            return mapper.toDto(d);
        });
    }
    public DisputeDto get(UUID id, UUID user, UUID provider) {
        var d = repository.findById(id).orElseThrow(DisputeNotFoundException::new);
        requireParticipant(d,user,provider); return mapper.toDto(d);
    }
    private void requireParticipant(Dispute d, UUID user, UUID provider) {
        if (!TrustSupport.participant(d.getClientId(),d.getProviderId(),user,provider)) throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    public List<DisputeDto> orderDisputes(UUID id, UUID user, UUID provider) {
        var order = orders.snapshot(id); orders.isClient(order,user,provider,ErrorCode.INVALID_REQUEST);
        return repository.findByOrderIdOrderByCreatedAtDesc(id).stream().map(mapper::toDto).toList();
    }
    public PageResponse<DisputeDto> myDisputes(UUID user, UUID provider, DisputeStatus status, int page, int size) {
        return TrustSupport.response(repository.findMyDisputes(user,provider,status,TrustSupport.page(page,size,"disputeId")).map(mapper::toDto));
    }
}
