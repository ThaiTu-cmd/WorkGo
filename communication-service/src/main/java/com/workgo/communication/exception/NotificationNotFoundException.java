package com.workgo.communication.exception;

public class NotificationNotFoundException extends AppException {
    public NotificationNotFoundException() {
        super(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
}
