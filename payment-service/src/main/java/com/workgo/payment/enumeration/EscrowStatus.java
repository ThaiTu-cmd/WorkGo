package com.workgo.payment.enumeration;

public enum EscrowStatus {
    PENDING,
    HOLDING,
    RELEASED,
    REFUNDED,
    PARTIALLY_REFUNDED,
    FROZEN;

    public boolean canTransitionTo(EscrowStatus next){
        return switch (this){
            case PENDING -> next == HOLDING;
            case HOLDING -> next == RELEASED || next == REFUNDED
                    || next == PARTIALLY_REFUNDED || next == FROZEN;
            case FROZEN -> next == HOLDING || next == RELEASED || next == REFUNDED;
            case PARTIALLY_REFUNDED -> next == RELEASED;
            case RELEASED, REFUNDED -> false;
        };
    }
}
