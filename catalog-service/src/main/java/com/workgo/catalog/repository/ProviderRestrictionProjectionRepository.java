package com.workgo.catalog.repository;
import com.workgo.catalog.entity.ProviderRestrictionProjection;import org.springframework.data.jpa.repository.JpaRepository;import java.util.UUID;
public interface ProviderRestrictionProjectionRepository extends JpaRepository<ProviderRestrictionProjection,String>{boolean existsByProviderIdAndBlockedTrue(UUID provider);boolean existsByProviderIdAndBlockedTrueAndSourceNot(UUID provider,String source);}
