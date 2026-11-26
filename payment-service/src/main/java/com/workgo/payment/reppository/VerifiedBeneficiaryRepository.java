package com.workgo.payment.reppository;
import com.workgo.payment.entity.VerifiedBeneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import java.time.Instant;
public interface VerifiedBeneficiaryRepository extends JpaRepository<VerifiedBeneficiary,UUID> {
    List<VerifiedBeneficiary> findByUserIdAndExpiresAtAfter(UUID userId,Instant now);
}
