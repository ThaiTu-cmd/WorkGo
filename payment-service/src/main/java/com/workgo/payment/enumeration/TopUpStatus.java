package com.workgo.payment.enumeration;

public enum TopUpStatus {
    INITIATED,
    PENDING,
    SUCCEEDED,
    FAILED,
    UNKNOWN;

    //tien that da ve (callback thanh cong co chu ky) thi luon ghi co, ke ca sau FAILED / UNKNOWN
    public boolean canTransitionTo(TopUpStatus next){
        return switch (this){
            case INITIATED -> next == PENDING || next == FAILED;
            case PENDING -> next == SUCCEEDED || next == FAILED || next == UNKNOWN;
            case UNKNOWN -> next == SUCCEEDED || next == FAILED;
            case FAILED -> next == SUCCEEDED;
            case SUCCEEDED -> false;
        };
    }
}
