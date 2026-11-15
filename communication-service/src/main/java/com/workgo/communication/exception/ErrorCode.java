package com.workgo.communication.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1004, "Mã lỗi validation không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Không có quyền truy cập", HttpStatus.FORBIDDEN),
    INVALID_REQUEST(1008, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),

    CHAT_NOT_FOUND(4001, "Không tìm thấy cuộc hội thoại", HttpStatus.NOT_FOUND),
    NOT_CONVERSATION_PARTICIPANT(4002, "Bạn không phải thành viên của cuộc hội thoại này", HttpStatus.FORBIDDEN),
    CONVERSATION_NOT_ACTIVE(4003, "Cuộc hội thoại đã đóng hoặc chỉ cho phép đọc", HttpStatus.BAD_REQUEST),
    CANNOT_CHAT_WITH_SELF(4004, "Không thể tự tạo cuộc hội thoại với chính mình", HttpStatus.BAD_REQUEST),
    INVALID_CONVERSATION_CONTEXT(4005, "Ngữ cảnh hội thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    MESSAGE_NOT_FOUND(4006, "Không tìm thấy tin nhắn", HttpStatus.NOT_FOUND),
    EMPTY_MESSAGE(4007, "Tin nhắn phải có nội dung văn bản hoặc tệp đính kèm", HttpStatus.BAD_REQUEST),
    INVALID_ATTACHMENT_METADATA(4008, "Thông tin tệp đính kèm không hợp lệ hoặc vượt quá giới hạn", HttpStatus.BAD_REQUEST),
    NOTIFICATION_NOT_FOUND(4009, "Không tìm thấy thông báo", HttpStatus.NOT_FOUND),
    INVALID_STATUS_TRANSITION(4010, "Chuyển đổi trạng thái hội thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    IDEMPOTENCY_CONFLICT(4011, "Khóa chống trùng đã được dùng với nội dung khác", HttpStatus.CONFLICT),
    SEND_RATE_LIMITED(4012, "Bạn gửi tin nhắn quá nhanh, vui lòng thử lại sau", HttpStatus.TOO_MANY_REQUESTS);

    private final int code;
    private final String message;
    private final HttpStatus statusCode;
}
