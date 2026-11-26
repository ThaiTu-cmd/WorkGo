package com.workgo.order.service;
import com.workgo.order.entity.ProviderAdmission;
import com.workgo.order.reppository.ProviderAdmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.UUID;
@Service @RequiredArgsConstructor
public class ProviderAdmissionInitializer {
    private final ProviderAdmissionRepository rows;
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public void ensure(UUID id){if(!rows.existsById(id))rows.saveAndFlush(new ProviderAdmission(id));}
}
