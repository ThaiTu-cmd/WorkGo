package com.workgo.communication.exception;

public class ChatNotFoundException extends AppException {
    public ChatNotFoundException() {
        super(ErrorCode.CHAT_NOT_FOUND);
    }
}
