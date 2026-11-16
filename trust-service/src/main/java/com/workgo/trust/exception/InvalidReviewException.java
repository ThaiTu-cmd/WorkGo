package com.workgo.trust.exception;

public class InvalidReviewException extends AppException {
    public InvalidReviewException() {
        super(ErrorCode.INVALID_REVIEW);
    }
}
