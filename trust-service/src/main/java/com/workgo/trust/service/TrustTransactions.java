package com.workgo.trust.service;

import com.workgo.trust.entity.TrustCoordinationLock;
import jakarta.persistence.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.*;
import java.util.function.Supplier;

@Component
public class TrustTransactions {
    @PersistenceContext private EntityManager em;
    private final TransactionTemplate transaction;
    private final TransactionTemplate initialize;
    public TrustTransactions(PlatformTransactionManager manager) {
        transaction = new TransactionTemplate(manager);
        initialize = new TransactionTemplate(manager);
        initialize.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }
    public <T> T locked(Collection<String> keys, Supplier<T> action) {
        var sorted = keys.stream().distinct().sorted().toList();
        // Initialize outside the business transaction. A concurrent initializer may
        // win the unique insert; catch only after that transaction rolls back.
        for (String key : sorted) {
            try {
                initialize.executeWithoutResult(s -> {
                    if (em.find(TrustCoordinationLock.class, key) == null) {
                        em.persist(new TrustCoordinationLock(key)); em.flush();
                    }
                });
            } catch (DataIntegrityViolationException | EntityExistsException | org.hibernate.exception.ConstraintViolationException exception) {
                // Verify the winner committed, rather than masking unrelated failures.
                if (!Boolean.TRUE.equals(initialize.execute(s -> em.find(TrustCoordinationLock.class, key) != null))) throw exception;
            }
        }
        return transaction.execute(s -> {
            for (String key : sorted) em.find(TrustCoordinationLock.class, key, LockModeType.PESSIMISTIC_WRITE);
            return action.get();
        });
    }
    public long nextVersion(String key) {
        var lock = em.find(TrustCoordinationLock.class, key, LockModeType.PESSIMISTIC_WRITE);
        lock.setSequenceValue(Math.addExact(lock.getSequenceValue(), 1));
        return lock.getSequenceValue();
    }
    public <T> T execute(Supplier<T> action) { return transaction.execute(s -> action.get()); }
}
