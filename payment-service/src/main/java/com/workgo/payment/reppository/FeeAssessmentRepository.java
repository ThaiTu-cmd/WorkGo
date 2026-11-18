package com.workgo.payment.reppository;

import com.workgo.payment.entity.FeeAssessment;
import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.enumeration.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeeAssessmentRepository extends JpaRepository<FeeAssessment, UUID> {

    Optional<FeeAssessment> findByOrderId(UUID orderId);

    boolean existsByOrderId(UUID orderId);

    List<FeeAssessment> findAllByChargedUserIdOrderByCreatedAtDesc(UUID chargedUserId);

    List<FeeAssessment> findAllByStatusOrderByCreatedAtAsc(FeeAssessmentStatus status);

    List<FeeAssessment> findAllByChargedUserIdAndFeeTypeAndStatusOrderByCreatedAtAsc(
            UUID chargedUserId, FeeType feeType, FeeAssessmentStatus status);
}
