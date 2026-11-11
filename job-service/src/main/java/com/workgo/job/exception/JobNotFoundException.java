package com.workgo.job.exception;

public class JobNotFoundException extends AppException {
    public JobNotFoundException() {
        super(ErrorCode.JOB_NOT_FOUND);
    }
}
