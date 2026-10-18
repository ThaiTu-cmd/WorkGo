package com.workgo.order.enumeration;

public enum OrderStatus {
    PENDING_PAYMENT,
    CONFIRMED,
    IN_PROGRESS,
    DELIVERED,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus next){
        return switch (this){
            case PENDING_PAYMENT -> next == CONFIRMED || next == CANCELLED;
            case CONFIRMED -> next == IN_PROGRESS || next == CANCELLED;
            case IN_PROGRESS -> next == DELIVERED || next == CANCELLED;
            case DELIVERED -> next == COMPLETED || next == CANCELLED || next == IN_PROGRESS;
            case  COMPLETED, CANCELLED -> false;
        };
    }
}
