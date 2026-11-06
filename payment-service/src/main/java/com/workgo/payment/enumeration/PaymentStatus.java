package com.workgo.payment.enumeration;

public enum PaymentStatus {
    INITIATED,
    PENDING,
    SUCCEEDED,
    FAILED,
    EXPIRED,
    CANCELLED;

    public boolean canTransitionTo(PaymentStatus next){
        return switch (this){
            case INITIATED -> next == PENDING || next == FAILED || next == EXPIRED || next == CANCELLED;
            case PENDING -> next == SUCCEEDED || next == FAILED || next == EXPIRED || next == CANCELLED;
            case EXPIRED, CANCELLED -> next == SUCCEEDED;
            case SUCCEEDED, FAILED -> false;
        };
    }
}
