package com.workgo.order.enumeration;

public enum OnsiteExecutionStatus {

    SCHEDULED,
    IN_SERVICE,
    SERVICE_DONE,

    ACCEPT,
    CANCELLED;

    public boolean canTransitionTo(OnsiteExecutionStatus next){
        return switch (this){
            case SCHEDULED -> next == IN_SERVICE || next == CANCELLED;
            case IN_SERVICE -> next == SERVICE_DONE;
            case SERVICE_DONE -> next == ACCEPT;
            case ACCEPT, CANCELLED -> false;
        };
    }

}
