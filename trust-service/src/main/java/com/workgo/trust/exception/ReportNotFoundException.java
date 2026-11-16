package com.workgo.trust.exception;

public class ReportNotFoundException extends AppException {
    public ReportNotFoundException() {
        super(ErrorCode.REPORT_NOT_FOUND);
    }
}
