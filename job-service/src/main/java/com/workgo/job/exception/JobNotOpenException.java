package com.workgo.job.exception;

public class JobNotOpenException extends AppException {
    public JobNotOpenException() {
        super(ErrorCode.JOB_NOT_OPEN);
    }
}
