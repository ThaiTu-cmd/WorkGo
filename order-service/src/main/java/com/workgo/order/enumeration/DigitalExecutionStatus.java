package com.workgo.order.enumeration;

public enum DigitalExecutionStatus {

    AWAITING_REQUIREMENTS,
    WORKING,
    SUBMITTED,
    REVISING,

    ACCEPT,
    CANCELLED;

    public boolean canTransitionTo(DigitalExecutionStatus next){
        return switch (this){
            case AWAITING_REQUIREMENTS -> next == WORKING || next == CANCELLED;
            case WORKING -> next == SUBMITTED || next == CANCELLED;
            case SUBMITTED -> next == ACCEPT || next == REVISING || next == CANCELLED;
            case REVISING -> next == WORKING || next == CANCELLED;
            case ACCEPT, CANCELLED ->  false;
        };
    }

}
