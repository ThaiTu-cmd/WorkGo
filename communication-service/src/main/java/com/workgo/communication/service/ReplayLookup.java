package com.workgo.communication.service;

import com.workgo.communication.repository.CommunicationTransactions;
import org.springframework.dao.DataAccessResourceFailureException;
import java.util.Optional;
import java.util.function.Supplier;

/** A duplicate-key winner is read outside the failed transaction, with bounded visibility retries. */
final class ReplayLookup {
    private ReplayLookup() {}

    static <T> T winner(CommunicationTransactions transactions, Supplier<Optional<T>> lookup) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            Optional<T> result = transactions.execute(lookup);
            if (result.isPresent()) return result.get();
            if (attempt < 3) {
                try { Thread.sleep(10L * attempt); }
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new DataAccessResourceFailureException("Interrupted reading committed replay", e);
                }
            }
        }
        throw new DataAccessResourceFailureException("Committed replay is not yet available");
    }
}
