package com.workgo.identity.enumeration;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;

public enum VerificationStatus {
    PENDING,
    VERIFIED,
    REJECTED,
    SUSPENDED;

    public boolean canTransitionTo(VerificationStatus next){
        return switch (this){
            case PENDING -> next == VERIFIED || next == REJECTED;
            case VERIFIED -> next == SUSPENDED;
            case REJECTED -> next == SUSPENDED;
            case SUSPENDED -> next == VERIFIED || next == REJECTED;
        };
    }

    public VerificationStatus transitionTo(VerificationStatus next){
        if(!canTransitionTo(next)){
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }

        return next;
    }
}
