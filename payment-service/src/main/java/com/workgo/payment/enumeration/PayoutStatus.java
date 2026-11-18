package com.workgo.payment.enumeration;

public enum PayoutStatus {
    REQUESTED,
    PROCESSING,
    UNKNOWN,
    PAID,
    FAILED,
    CANCELLED;

    //PAID chi khi ngan hang / doi tac xac nhan; UNKNOWN phai doi soat, khong tu coi la that bai de tra lai tien
    public boolean canTransitionTo(PayoutStatus next){
        return switch (this){
            case REQUESTED -> next == PROCESSING || next == CANCELLED || next == FAILED;
            case PROCESSING -> next == PAID || next == FAILED || next == UNKNOWN;
            case UNKNOWN -> next == PAID || next == FAILED;
            case PAID, FAILED, CANCELLED -> false;
        };
    }
}
