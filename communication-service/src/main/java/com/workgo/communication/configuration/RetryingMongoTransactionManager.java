package com.workgo.communication.configuration;

import com.mongodb.MongoException;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;

/** Retry the same commit, rather than the business transaction, when its outcome is ambiguous. */
public class RetryingMongoTransactionManager extends MongoTransactionManager {
    public RetryingMongoTransactionManager(MongoDatabaseFactory factory) {
        super(factory);
    }

    @Override
    protected void doCommit(MongoTransactionObject transaction) throws Exception {
        for (int attempt = 1; ; attempt++) {
            try {
                transaction.commitTransaction();
                return;
            } catch (MongoException exception) {
                if (!exception.hasErrorLabel(MongoException.UNKNOWN_TRANSACTION_COMMIT_RESULT_LABEL) || attempt == 3) {
                    throw exception;
                }
                try {
                    Thread.sleep(10L * attempt);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    // Preserve the unknown-commit label so callers cannot replay the transaction body.
                    exception.addSuppressed(interrupted);
                    throw exception;
                }
            }
        }
    }
}
