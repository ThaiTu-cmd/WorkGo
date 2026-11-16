package com.workgo.trust.service;

import com.workgo.trust.dto.request.ReviewSubmitReq;
import com.workgo.trust.dto.request.client.*;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.entity.Review;
import com.workgo.trust.enumeration.*;
import com.workgo.trust.exception.*;
import com.workgo.trust.mapper.ReviewMapper;
import com.workgo.trust.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import java.math.*;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository repository;
    private final ReviewMapper mapper;
    private final TrustOrderAccess orders;
    private final TrustTransactions transactions;
    private final TrustOutbox outbox;
    @Value("${app.review.window-days:14}") private int windowDays;

    static List<String> keys(UUID order, UUID provider, UUID service) {
        var keys = new ArrayList<>(List.of("order:" + order, "rating:provider:" + provider));
        if (service != null) keys.add("rating:service:" + service);
        return keys;
    }
    public ReviewDto submit(ReviewSubmitReq req, UUID user, UUID currentProvider) {
        var order = orders.snapshot(req.orderId()); // Deliberately before any DB transaction.
        if (!"COMPLETED".equals(order.orderStatus())) throw new InvalidReviewException(ErrorCode.ORDER_NOT_COMPLETED_FOR_REVIEW);
        boolean client = orders.isClient(order, user, currentProvider, ErrorCode.CANNOT_REVIEW_SELF);
        Instant expires = orders.expires(order, windowDays);
        if (Instant.now().isAfter(expires)) throw new InvalidReviewException(ErrorCode.REVIEW_WINDOW_EXPIRED);
        ReviewDirection direction = client ? ReviewDirection.CLIENT_TO_PROVIDER : ReviewDirection.PROVIDER_TO_CLIENT;
        try {
            return transactions.locked(keys(order.orderId(), order.providerId(), order.serviceId()), () -> {
                var existing = repository.findAllByOrderIdForUpdate(req.orderId());
                if (existing.stream().anyMatch(r -> r.getDirection() == direction)) throw new AppException(ErrorCode.ALREADY_REVIEWED);
                if (Instant.now().isAfter(expires)) throw new InvalidReviewException(ErrorCode.REVIEW_WINDOW_EXPIRED);
                var review = repository.saveAndFlush(Review.builder().orderId(order.orderId()).serviceId(order.serviceId())
                        .direction(direction).reviewerId(client ? user : currentProvider)
                        .revieweeId(client ? order.providerId() : order.clientId()).rating(req.rating())
                        .comment(req.comment()).publishEligibleAt(expires).build());
                if (!existing.isEmpty()) {
                    existing.add(review);
                    publish(existing, order.clientId(), order.providerId(), order.serviceId());
                }
                return mapper.toDto(review);
            });
        } catch (DataIntegrityViolationException e) {
            if (repository.findByOrderIdAndDirection(req.orderId(), direction).isPresent()) throw new AppException(ErrorCode.ALREADY_REVIEWED);
            throw e;
        }
    }
    private void publish(List<Review> reviews, UUID client, UUID provider, UUID service) {
        Instant now = Instant.now();
        var changed = reviews.stream().filter(r -> !r.isPublished() && r.getModerationStatus() == ModerationStatus.APPROVED).toList();
        if (changed.isEmpty()) return;
        for (var r : changed) { r.setPublished(true); r.setPublishedAt(now); }
        repository.flush();
        if (changed.stream().anyMatch(r -> r.getDirection() == ReviewDirection.CLIENT_TO_PROVIDER)) {
            var stats = repository.calculateRevieweeRatingStats(provider, ReviewDirection.CLIENT_TO_PROVIDER);
            outbox.add("PROVIDER", provider, "review.published.provider", new ProviderRatingStatsRequest(avg(stats), count(stats),
                    transactions.nextVersion("rating:provider:" + provider)));
            if (service != null) {
                var serviceStats = repository.calculateServiceRatingStats(service);
                outbox.add("SERVICE", service, "review.published.service", new ServiceRatingStatsRequest(avg(serviceStats), count(serviceStats),
                        transactions.nextVersion("rating:service:" + service)));
            }
        }
        for (var r : changed) {
            boolean toProvider = r.getDirection() == ReviewDirection.CLIENT_TO_PROVIDER;
            outbox.notify(toProvider ? null : client, toProvider ? provider : null, "REVIEW_PUBLISHED", "REVIEW", r.getReviewId());
        }
    }
    public void publishDueOrder(UUID orderId) {
        var snapshot = repository.findAllByOrderId(orderId);
        if (snapshot.isEmpty()) return;
        var sample = snapshot.getFirst();
        UUID provider = sample.getDirection() == ReviewDirection.CLIENT_TO_PROVIDER ? sample.getRevieweeId() : sample.getReviewerId();
        UUID client = sample.getDirection() == ReviewDirection.CLIENT_TO_PROVIDER ? sample.getReviewerId() : sample.getRevieweeId();
        transactions.locked(keys(orderId, provider, sample.getServiceId()), () -> {
            var rows = repository.findAllByOrderIdForUpdate(orderId);
            var due = rows.stream().filter(r -> !r.getPublishEligibleAt().isAfter(Instant.now())).toList();
            publish(due, client, provider, sample.getServiceId()); return null;
        });
    }
    public List<UUID> dueOrders() {
        return repository.findDueUnpublishedReviews(Instant.now(), PageRequest.of(0, 100)).stream().map(Review::getOrderId).distinct().toList();
    }
    public RatingSummaryDto providerReviews(UUID id, int page, int size) { return revieweeReviews(id, ReviewDirection.CLIENT_TO_PROVIDER, page, size); }
    public RatingSummaryDto clientReviews(UUID id, int page, int size) { return revieweeReviews(id, ReviewDirection.PROVIDER_TO_CLIENT, page, size); }
    private RatingSummaryDto revieweeReviews(UUID id, ReviewDirection direction, int page, int size) {
        var rows = repository.findPublicReviewsByReviewee(id, direction, TrustSupport.page(page, size, "reviewId"));
        var stats = repository.calculateRevieweeRatingStats(id, direction);
        return new RatingSummaryDto(id, avg(stats), count(stats), TrustSupport.response(rows.map(mapper::toDto)));
    }
    public RatingSummaryDto serviceReviews(UUID id, int page, int size) {
        var rows = repository.findPublicReviewsByService(id, TrustSupport.page(page, size, "reviewId"));
        var stats = repository.calculateServiceRatingStats(id);
        return new RatingSummaryDto(id, avg(stats), count(stats), TrustSupport.response(rows.map(mapper::toDto)));
    }
    public PageResponse<ReviewDto> myReviews(UUID user, UUID provider, ReviewDirection direction, int page, int size) {
        return TrustSupport.response(repository.findMyReviews(user, provider, direction, TrustSupport.page(page,size,"reviewId")).map(mapper::toDto));
    }
    public OrderReviewStatusDto orderStatus(UUID orderId, UUID user, UUID provider) {
        var order = orders.snapshot(orderId);
        boolean client = orders.isClient(order, user, provider, ErrorCode.CANNOT_REVIEW_SELF);
        var direction = client ? ReviewDirection.CLIENT_TO_PROVIDER : ReviewDirection.PROVIDER_TO_CLIENT;
        var rows = repository.findAllByOrderId(orderId);
        var mine = rows.stream().filter(r -> r.getDirection() == direction).findFirst().orElse(null);
        var other = rows.stream().filter(r -> r.getDirection() != direction).findFirst().orElse(null);
        boolean visible = other != null && other.isPublished() && other.getModerationStatus() == ModerationStatus.APPROVED;
        return new OrderReviewStatusDto(orderId,direction,mine != null,other != null,visible,
                order.completedAt() == null ? null : orders.expires(order,windowDays),mapper.toDto(mine),visible ? mapper.toDto(other) : null);
    }
    static double avg(RatingAggregateProjection stats) {
        return stats == null || stats.getRatingAvg() == null ? 0 : BigDecimal.valueOf(stats.getRatingAvg()).setScale(2,RoundingMode.HALF_UP).doubleValue();
    }
    static long count(RatingAggregateProjection stats) { return stats == null || stats.getRatingCount() == null ? 0 : stats.getRatingCount(); }
}
