package com.workgo.trust.exception;

public class DisputeNotFoundException extends AppException {
    public DisputeNotFoundException() {
        super(ErrorCode.DISPUTE_NOT_FOUND);
    }
}
