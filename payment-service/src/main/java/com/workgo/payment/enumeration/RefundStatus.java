package com.workgo.payment.enumeration;

public enum RefundStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED;

    public boolean canTransitionTo(RefundStatus next){
        return switch (this){
            case PENDING -> next == PROCESSING || next == COMPLETED || next == FAILED;
            case PROCESSING -> next == COMPLETED || next == FAILED;
            case FAILED -> next == PROCESSING;
            case COMPLETED -> false;
        };
    }
}
