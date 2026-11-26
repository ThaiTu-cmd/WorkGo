package com.workgo.job.repository;
import com.workgo.job.entity.ProviderRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ProviderRestrictionRepository extends JpaRepository<ProviderRestriction,String>{
    boolean existsByProviderIdAndBlockedTrue(UUID provider);
    java.util.List<com.workgo.job.entity.ProviderRestriction> findByProviderIdAndBlockedTrue(UUID provider);
}
