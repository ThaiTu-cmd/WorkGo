package com.workgo.job.exception;

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

    JOB_NOT_FOUND(3001, "Không tìm thấy công việc", HttpStatus.NOT_FOUND),
    JOB_NOT_OPEN(3002, "Công việc không ở trạng thái mở tuyển", HttpStatus.BAD_REQUEST),
    ALREADY_APPLIED(3003, "Bạn đã gửi ứng tuyển cho công việc này rồi", HttpStatus.CONFLICT),
    CANNOT_APPLY_OWN_JOB(3004, "Client không thể tự ứng tuyển vào công việc của chính mình", HttpStatus.BAD_REQUEST),
    APPLICATION_NOT_FOUND(3005, "Không tìm thấy hồ sơ ứng tuyển", HttpStatus.NOT_FOUND),
    PROPOSAL_NOT_FOUND(3006, "Không tìm thấy đề xuất", HttpStatus.NOT_FOUND),
    PROPOSAL_NOT_PENDING(3007, "Đề xuất không ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST),
    INVALID_BUDGET_RANGE(3008, "Ngân sách tối thiểu không được lớn hơn ngân sách tối đa", HttpStatus.BAD_REQUEST),
    LOCATION_REQUIRED(3009, "Dịch vụ On-site hoặc Delivery bắt buộc phải có địa điểm", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(3010, "Chuyển đổi trạng thái không hợp lệ", HttpStatus.BAD_REQUEST),
    JOB_DEADLINE_PASSED(3011, "Công việc đã quá hạn tuyển", HttpStatus.BAD_REQUEST),
    PROVIDER_NOT_ACTIVE(3012, "Provider chưa được kích hoạt", HttpStatus.FORBIDDEN),
    PROVIDER_NOT_VERIFIED(3013, "Provider chưa được xác minh", HttpStatus.FORBIDDEN),
    PROPOSAL_EXPIRED(3014, "Đề xuất đã hết hạn", HttpStatus.BAD_REQUEST),
    APPLICATION_NOT_VALID(3015, "Hồ sơ ứng tuyển không còn hợp lệ", HttpStatus.BAD_REQUEST),
    ORDER_CREATION_FAILED(3016, "Chưa thể tạo đơn hàng, vui lòng thử lại sau", HttpStatus.SERVICE_UNAVAILABLE);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
