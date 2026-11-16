package com.workgo.payment.service;

import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.EscrowAccountRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EscrowLockService {
    private final EscrowAccountRepository repository;
    private final EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public EscrowAccount lock(UUID orderId) {
        try {
            EscrowAccount escrow = repository.findByOrderIdForUpdate(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ESCROW_NOT_FOUND));
            // Callers such as OrderSync may already have a managed instance.
            entityManager.refresh(escrow, LockModeType.PESSIMISTIC_WRITE);
            return escrow;
        } catch (OptimisticLockingFailureException | jakarta.persistence.OptimisticLockException e) {
            // Never authorize from stale state or retry a financial action inside this transaction.
            throw new AppException(ErrorCode.ESCROW_CONCURRENT_COMMAND);
        }
    }
}
