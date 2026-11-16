package com.workgo.communication.exception;

public class MessageNotFoundException extends AppException {
    public MessageNotFoundException() {
        super(ErrorCode.MESSAGE_NOT_FOUND);
    }
}
