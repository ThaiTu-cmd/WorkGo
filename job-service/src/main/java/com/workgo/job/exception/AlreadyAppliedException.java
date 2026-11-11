package com.workgo.job.exception;

public class AlreadyAppliedException extends AppException {
    public AlreadyAppliedException() {
        super(ErrorCode.ALREADY_APPLIED);
    }
}
