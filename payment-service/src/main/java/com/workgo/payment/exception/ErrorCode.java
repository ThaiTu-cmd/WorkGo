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
    UNAUTHORIZED(1007, "You do not have that permission", HttpStatus.FORBIDDEN),
    FORBIDDEN(1008, "You do not have permission to perform this action", HttpStatus.FORBIDDEN),

    //===============ORDER====================
    ORDER_NOT_FOUND(2001, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_SERVICE_UNAVAILABLE(2002, "Order service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    IDENTITY_SERVICE_UNAVAILABLE(2003, "Identity service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),

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
    PAYMENT_AMOUNT_OUT_OF_RANGE(3012, "Amount is out of range for this payment gateway", HttpStatus.BAD_REQUEST),
    PAYMENT_ORDER_PAID_IN_CASH(3013, "Cash order is paid directly to the provider", HttpStatus.BAD_REQUEST),
    PAYMENT_METHOD_NOT_SUPPORTED(3014, "Payment method is not supported by payment gateway", HttpStatus.BAD_REQUEST),
    PAYMENT_ORDER_USE_WALLET(3015, "Order is paid from WorkGo wallet, top up the wallet to pay", HttpStatus.BAD_REQUEST),
    PAYMENT_AMOUNT_NOT_WHOLE_VND(3016, "Order amount must be a whole VND amount", HttpStatus.CONFLICT),

    //===============ESCROW===================
    ESCROW_NOT_FOUND(3101, "Escrow not found", HttpStatus.NOT_FOUND),
    ESCROW_INVALID_STATUS(3102, "Escrow cannot be released or refunded in its current status", HttpStatus.CONFLICT),
    ESCROW_FROZEN(3103, "Escrow is frozen by a dispute", HttpStatus.CONFLICT),
    ESCROW_DISPUTE_ID_REQUIRED(3104, "Dispute id is required", HttpStatus.BAD_REQUEST),

    ESCROW_COMMAND_CONFLICT(3105, "Escrow command identity was reused with different payload", HttpStatus.CONFLICT),
    ESCROW_DISPUTE_CONFLICT(3106, "Escrow belongs to another dispute", HttpStatus.CONFLICT),
    TRUST_SERVICE_UNAVAILABLE(3107, "Trust dispute status is unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    ESCROW_CONCURRENT_COMMAND(3108, "Escrow changed concurrently; reconcile before retry", HttpStatus.CONFLICT),
    ESCROW_ADJUST_NOT_SUPPORTED(3109, "Only wallet escrow can change its held amount", HttpStatus.CONFLICT),
    ESCROW_ADJUST_INVALID(3110, "Adjust needs an amendment id and a positive whole VND amount", HttpStatus.BAD_REQUEST),
    SETTLEMENT_INVALID(3111, "Settlement needs decision, order, operation, destination and a whole VND amount", HttpStatus.BAD_REQUEST),
    SETTLEMENT_CONFLICT(3112, "Decision id was reused with a different settlement payload", HttpStatus.CONFLICT),
    SETTLEMENT_ORDER_SETTLED(3113, "Order was already settled by another decision", HttpStatus.CONFLICT),
    SETTLEMENT_MISMATCH(3114, "Settlement does not match the escrow amount, destination or fee policy", HttpStatus.CONFLICT),
    SETTLEMENT_NOT_SUPPORTED(3115, "Only wallet escrow can be settled by decision", HttpStatus.CONFLICT),
    ORDER_SYNC_RETRY_NOT_ALLOWED(3116, "Only a held wallet escrow whose order confirmation failed can be retried", HttpStatus.CONFLICT),

    //===============REFUND===================
    REFUND_PERCENT_NOT_SUPPORTED(3201, "Only 100 percent refund is supported", HttpStatus.BAD_REQUEST),

    //===============GATEWAY==================
    GATEWAY_UNAVAILABLE(3301, "Payment gateway is unavailable, please try again", HttpStatus.SERVICE_UNAVAILABLE),
    GATEWAY_INVALID_SIGNATURE(3302, "Invalid gateway signature", HttpStatus.BAD_REQUEST),

    //===============WALLET===================
    WALLET_POSTING_INVALID(3401, "Wallet posting is invalid", HttpStatus.BAD_REQUEST),
    WALLET_INSUFFICIENT_FUNDS(3402, "Wallet balance is not enough", HttpStatus.CONFLICT),
    WALLET_IDEMPOTENCY_CONFLICT(3403, "Idempotency key was already used for a different posting", HttpStatus.CONFLICT),

    //===============TOP UP===================
    TOP_UP_NOT_FOUND(3501, "Top-up not found", HttpStatus.NOT_FOUND),
    TOP_UP_AMOUNT_INVALID(3502, "Top-up amount must be a positive whole VND amount", HttpStatus.BAD_REQUEST),
    TOP_UP_IDEMPOTENCY_KEY_REUSED(3503, "Idempotency-Key was already used for another top-up", HttpStatus.CONFLICT),
    TOP_UP_SOURCE_MISMATCH(3504, "Gateway confirmation does not match this top-up", HttpStatus.BAD_REQUEST),
    TOP_UP_LIMIT_EXCEEDED(3505, "Top-up is under the minimum or over the daily limit", HttpStatus.BAD_REQUEST),
    TOP_UP_RESOLVE_INVALID(3506, "Only UNKNOWN top-up can be resolved, with SUCCEEDED or FAILED, a gateway reference and a reason", HttpStatus.BAD_REQUEST),

    //===============FEE===================
    FEE_POLICY_INVALID(3601, "Fee policy needs a reason, rates from 0 to 0.5, a whole VND cap and an effective time not in the past", HttpStatus.BAD_REQUEST),
    FEE_POLICY_NOT_FOUND(3602, "No fee policy is effective", HttpStatus.INTERNAL_SERVER_ERROR),
    FEE_ALREADY_ASSESSED(3603, "This order already has a fee assessment", HttpStatus.CONFLICT),
    FEE_CHARGE_NOT_SUPPORTED(3604, "Cancellation fee is only supported for wallet orders", HttpStatus.CONFLICT),
    CASH_FEE_INVALID(3605, "Cash fee needs an order, a provider and whole VND amounts", HttpStatus.BAD_REQUEST),

    //===============PAYOUT===================
    PAYOUT_INVALID(3701, "Payout needs a whole VND amount over the minimum and a bank account", HttpStatus.BAD_REQUEST),
    PAYOUT_LIMIT_EXCEEDED(3702, "Payout is over the daily limit", HttpStatus.BAD_REQUEST),
    PAYOUT_BLOCKED_BY_DEBT(3703, "Pay the outstanding fee before withdrawing", HttpStatus.CONFLICT),
    PAYOUT_NOT_FOUND(3704, "Payout not found", HttpStatus.NOT_FOUND),
    PAYOUT_INVALID_STATUS(3705, "Payout cannot move to that status", HttpStatus.CONFLICT),
    PAYOUT_IDEMPOTENCY_KEY_REUSED(3706, "Idempotency-Key was already used for another payout", HttpStatus.CONFLICT),
    PAYOUT_REFERENCE_REQUIRED(3707, "Bank or partner reference and a reason are required", HttpStatus.BAD_REQUEST);

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
