package com.workgo.identity.service;
import com.workgo.identity.entity.SanctionProjection;import com.workgo.identity.repository.*;import lombok.RequiredArgsConstructor;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import java.util.*;import java.time.Instant;
@Service @RequiredArgsConstructor
public class SanctionProjectionService {
 private final SanctionProjectionRepository rows;private final ProviderSanctionRepository sanctions;private final InternalProviderProfileRepository profiles;
 @Transactional public void refresh(UUID provider){var p=profiles.findById(provider).orElseThrow();profiles.lockFinancialRestriction(p.userId()).orElseThrow();boolean blocked=sanctions.active(p.userId(),Set.of("PROVIDER","ACCOUNT","SECURITY"),Instant.now())>0;var r=rows.findById(provider).orElseGet(()->new SanctionProjection(provider));if(r.getSourceVersion()==0||r.isBlocked()!=blocked){r.setBlocked(blocked);r.setSourceVersion(Math.addExact(r.getSourceVersion(),1));rows.save(r);}}
}
