package com.workgo.payment.reppository;

import com.workgo.payment.entity.FeePolicyVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeePolicyVersionRepository extends JpaRepository<FeePolicyVersion, UUID> {

    Optional<FeePolicyVersion> findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(Instant now);

    Optional<FeePolicyVersion> findTopByOrderByVersionNoDesc();

    Optional<FeePolicyVersion> findByVersionNo(Integer versionNo);

    List<FeePolicyVersion> findAllByOrderByVersionNoDesc();
}
