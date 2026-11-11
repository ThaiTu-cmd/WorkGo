package com.workgo.job.repository;

import com.workgo.job.entity.Job;
import com.workgo.job.enumeration.ExecutionType;
import com.workgo.job.enumeration.JobStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {
    Page<Job> findByClientId(UUID clientId, Pageable pageable);

    /** Public jobs at the caller's clock instant; budget filters use inclusive interval overlap. */
    default Page<Job> searchOpenJobs(String keyword, UUID categoryId, ExecutionType executionType,
                                    BigDecimal minBudget, BigDecimal maxBudget, Instant now, Pageable pageable) {
        Objects.requireNonNull(now, "Search clock instant is required");
        return findAll((root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.equal(root.get("status"), JobStatus.OPEN));
            predicates.add(cb.or(cb.isNull(root.get("deadlineAt")), cb.greaterThan(root.get("deadlineAt"), now)));
            if (keyword != null && !keyword.isBlank()) {
                String literal = keyword.strip().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
                String pattern = "%" + literal + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("title")), pattern, '\\'),
                        cb.like(cb.lower(root.get("description")), pattern, '\\')));
            }
            if (categoryId != null) predicates.add(cb.equal(root.get("categoryId"), categoryId));
            if (executionType != null) predicates.add(cb.equal(root.get("executionType"), executionType));
            if (minBudget != null) predicates.add(cb.or(cb.isNull(root.get("budgetMax")),
                    cb.greaterThanOrEqualTo(root.get("budgetMax"), minBudget)));
            if (maxBudget != null) predicates.add(cb.or(cb.isNull(root.get("budgetMin")),
                    cb.lessThanOrEqualTo(root.get("budgetMin"), maxBudget)));
            return cb.and(predicates.toArray(Predicate[]::new));
        }, pageable);
    }
}
