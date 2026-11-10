package com.workgo.payment.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum ErrorCode {
    //=============SYSTEM====================
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorize Exception", HttpStatus.INTERNAL_SERVER_ERROR),
    SUCCESS(1000, "Success", HttpStatus.ACCEPTED),

    //===============USER====================
    INVALID_KEY(1004, "Invalid message key", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1005, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have that permission", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1008, "You do not have permission to perform this action", HttpStatus.FORBIDDEN),

    //===============ORDER====================
    ORDER_NOT_FOUND(2001, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_SERVICE_UNAVAILABLE(2002, "Order service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    //===============PAYMENT==================
    PAYMENT_NOT_FOUND(3001, "Payment not found", HttpStatus.NOT_FOUND),
    PAYMENT_ORDER_NOT_PAYABLE(3002, "Order is not waiting for payment", HttpStatus.BAD_REQUEST),
    PAYMENT_ORDER_ALREADY_PAID(3003, "Order has already been paid", HttpStatus.CONFLICT),
    PAYMENT_IDEMPOTENCY_KEY_REQUIRED(3004, "Idempotency-Key header is required", HttpStatus.BAD_REQUEST),
    PAYMENT_IDEMPOTENCY_KEY_REUSED(3005, "Idempotency-Key was already used for another payment", HttpStatus.CONFLICT),
    PAYMENT_INVALID_STATUS_TRANSITION(3006, "Payment cannot move to that status", HttpStatus.BAD_REQUEST),
    PAYMENT_GATEWAY_NOT_SUPPORTED(3007, "Payment gateway is not supported yet", HttpStatus.BAD_REQUEST),
    PAYMENT_AMOUNT_MISMATCH(3008, "Paid amount does not match payment amount", HttpStatus.BAD_REQUEST),
    PAYMENT_SLOT_HOLD_EXPIRED(3009, "Booking slot hold has expired or is about to expire, please create a new order", HttpStatus.CONFLICT),
    PAYMENT_ORDER_ID_REQUIRED(3010, "Order id is required", HttpStatus.BAD_REQUEST),
    PAYMENT_GATEWAY_REQUIRED(3011, "Payment gateway is required", HttpStatus.BAD_REQUEST),

    //===============ESCROW===================
    ESCROW_NOT_FOUND(3101, "Escrow not found", HttpStatus.NOT_FOUND),
    ESCROW_INVALID_STATUS(3102, "Escrow cannot be released or refunded in its current status", HttpStatus.CONFLICT),

    //===============REFUND===================
    REFUND_PERCENT_NOT_SUPPORTED(3201, "Only 100 percent refund is supported", HttpStatus.BAD_REQUEST),

    //===============GATEWAY==================
    GATEWAY_UNAVAILABLE(3301, "Payment gateway is unavailable, please try again", HttpStatus.SERVICE_UNAVAILABLE);

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
