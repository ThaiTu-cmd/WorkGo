package com.workgo.trust.exception;

public class ReviewNotFoundException extends AppException {
    public ReviewNotFoundException() {
        super(ErrorCode.REVIEW_NOT_FOUND);
    }
}
