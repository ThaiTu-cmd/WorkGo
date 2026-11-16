package com.workgo.trust.exception;

public class InvalidReviewException extends AppException {
    public InvalidReviewException(ErrorCode errorCode) {
        super(errorCode);
    }
    public InvalidReviewException() {
        super(ErrorCode.INVALID_REVIEW);
    }
}
