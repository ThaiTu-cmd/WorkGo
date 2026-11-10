package com.workgo.job.exception;

import com.workgo.job.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException exception) {
        return response(exception.getErrorCode());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        var errors = exception.getBindingResult().getAllErrors();
        if (!errors.isEmpty()) {
            String key = errors.get(0).getDefaultMessage();
            if (key != null) {
                try {
                    errorCode = ErrorCode.valueOf(key);
                } catch (IllegalArgumentException ignored) {
                    // Bean Validation defaults need not be ErrorCode keys.
                }
            }
        }
        return ResponseEntity.badRequest().body(body(errorCode));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException exception) {
        return response(ErrorCode.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException exception) {
        return response(ErrorCode.UNAUTHENTICATED);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> handleInvalidRequest(Exception exception) {
        return response(ErrorCode.INVALID_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception exception) {
        // Preserve MVC statuses and protocol headers (for example Allow on 405).
        if (exception instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
            return ResponseEntity.status(errorResponse.getStatusCode()).headers(errorResponse.getHeaders())
                    .body(body(ErrorCode.INVALID_REQUEST));
        }
        log.error("Unhandled job-service exception", exception);
        return response(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    private ResponseEntity<ApiResponse<Void>> response(ErrorCode errorCode) {
        return ResponseEntity.status(errorCode.getStatusCode()).body(body(errorCode));
    }

    private ApiResponse<Void> body(ErrorCode errorCode) {
        return ApiResponse.<Void>builder().code(errorCode.getCode()).message(errorCode.getMessage()).build();
    }
}
