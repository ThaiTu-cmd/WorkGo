package com.workgo.trust.service;
import com.workgo.trust.entity.ReputationProjection;
import com.workgo.trust.repository.ReputationProjectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.UUID;
@Service @RequiredArgsConstructor
public class ReputationProjectionService {
    private final ReputationProjectionRepository rows;
    @Transactional(propagation=Propagation.MANDATORY)
    public void record(UUID provider,int score){var r=rows.findById(provider).orElseGet(()->new ReputationProjection(provider));r.setScore(score);r.setSourceVersion(Math.addExact(r.getSourceVersion(),1));rows.save(r);}
    @Transactional(propagation=Propagation.MANDATORY)
    public void ensure(UUID provider,int score){if(!rows.existsById(provider))record(provider,score);}
}
