package com.workgo.communication.repository;

import com.mongodb.MongoException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Supplier;

/** Bounded retry of transaction bodies; ambiguous commits must never replay business writes. */
@Component
public class CommunicationTransactions {
    private final TransactionTemplate transaction;

    public CommunicationTransactions(MongoTransactionManager manager) {
        transaction = new TransactionTemplate(manager);
        // Every attempt owns its transaction, including when called by a transactional service.
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public <T> T execute(Supplier<T> work) {
        for (int attempt = 1; ; attempt++) {
            try {
                return transaction.execute(status -> work.get());
            } catch (RuntimeException exception) {
                if (hasLabel(exception, MongoException.UNKNOWN_TRANSACTION_COMMIT_RESULT_LABEL)) {
                    throw new DataAccessResourceFailureException("MongoDB commit result is unknown", exception);
                }
                if (!hasLabel(exception, MongoException.TRANSIENT_TRANSACTION_ERROR_LABEL)) throw exception;
                if (attempt == 3) {
                    throw new DataAccessResourceFailureException("MongoDB transaction retry exhausted", exception);
                }
                try {
                    Thread.sleep(10L * attempt);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new DataAccessResourceFailureException("MongoDB transaction retry interrupted", interrupted);
                }
            }
        }
    }

    private boolean hasLabel(Throwable exception, String label) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof MongoException mongo && mongo.hasErrorLabel(label)) return true;
        }
        return false;
    }
}
