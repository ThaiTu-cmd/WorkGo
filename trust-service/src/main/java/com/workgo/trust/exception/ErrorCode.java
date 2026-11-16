package com.workgo.trust.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1004, "Khóa thông báo lỗi không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Không có quyền truy cập", HttpStatus.FORBIDDEN),
    INVALID_REQUEST(1008, "Dữ liệu yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    REVIEW_NOT_FOUND(5001, "Không tìm thấy đánh giá", HttpStatus.NOT_FOUND),
    INVALID_REVIEW(5002, "Đánh giá không hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_NOT_COMPLETED_FOR_REVIEW(5003, "Chỉ được đánh giá khi đơn hàng đã hoàn tất (COMPLETED)", HttpStatus.BAD_REQUEST),
    REVIEW_WINDOW_EXPIRED(5004, "Đã hết thời hạn đánh giá cho đơn hàng này", HttpStatus.BAD_REQUEST),
    ALREADY_REVIEWED(5005, "Bạn đã gửi đánh giá cho đơn hàng này rồi", HttpStatus.CONFLICT),
    NOT_ORDER_PARTICIPANT(5006, "Bạn không phải khách hàng hoặc nhà cung cấp của đơn hàng này", HttpStatus.FORBIDDEN),
    CANNOT_REVIEW_SELF(5007, "Không thể tự đánh giá chính mình", HttpStatus.BAD_REQUEST),
    REPORT_NOT_FOUND(5008, "Không tìm thấy báo cáo vi phạm", HttpStatus.NOT_FOUND),
    CANNOT_REPORT_SELF(5009, "Không thể tự báo cáo chính mình", HttpStatus.BAD_REQUEST),
    DUPLICATE_ACTIVE_REPORT(5010, "Bạn đã có báo cáo đang chờ xử lý cho đối tượng này", HttpStatus.CONFLICT),
    DISPUTE_NOT_FOUND(5011, "Không tìm thấy hồ sơ tranh chấp", HttpStatus.NOT_FOUND),
    DISPUTE_ALREADY_ACTIVE(5012, "Đơn hàng này đang có tranh chấp chưa giải quyết", HttpStatus.CONFLICT),
    ORDER_NOT_DISPUTABLE(5013, "Trạng thái đơn hàng hiện tại không cho phép mở tranh chấp", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(5014, "Chuyển đổi trạng thái không hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND(5015, "Không tìm thấy đơn hàng liên kết", HttpStatus.NOT_FOUND),
    TARGET_NOT_FOUND(5016, "Không tìm thấy đối tượng được yêu cầu", HttpStatus.NOT_FOUND),
    IDEMPOTENCY_CONFLICT(5017, "Khóa chống trùng đã được sử dụng với dữ liệu khác", HttpStatus.CONFLICT),
    CONCURRENT_MODIFICATION(5018, "Dữ liệu đã thay đổi, vui lòng thử lại", HttpStatus.CONFLICT),
    DEPENDENCY_UNAVAILABLE(5019, "Dịch vụ phụ thuộc tạm thời không sẵn sàng", HttpStatus.SERVICE_UNAVAILABLE),
    DISPUTE_CANNOT_CANCEL(5020, "Chỉ người mở tranh chấp mới được rút khi tranh chấp đang ở trạng thái OPEN", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
