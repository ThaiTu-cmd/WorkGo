package com.workgo.order.exception;

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
    USER_EXISTED(1001, "User existed", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1002,"Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 5 characters", HttpStatus.BAD_REQUEST),
    INVALID_KEY(1004, "Invalid message key", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1005, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    USER_NOT_EXISTED(1006, "User dose not exist", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(1007, "You do not have that permission", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1008, "You do not have permission to perform this action", HttpStatus.FORBIDDEN),

    //===============ORDER====================
    ORDER_NOT_FOUND(2001, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_INVALID_STATUS_TRANSITION(2002, "Order cannot move to that status", HttpStatus.BAD_REQUEST),
    ORDER_CANNOT_BUY_OWN_SERVICE(2003, "You cannot order your own service", HttpStatus.BAD_REQUEST),
    ORDER_EXECUTION_TYPE_NOT_SUPPORTED(2004, "Execution type is not supported yet", HttpStatus.BAD_REQUEST),
    ORDER_CANCEL_NOT_ALLOWED(2005, "Order cannot be cancelled at this status", HttpStatus.BAD_REQUEST),
    SERVICE_ID_REQUIRED(2010, "Service id is required", HttpStatus.BAD_REQUEST),
    PACKAGE_ID_REQUIRED(2011, "Package id is required", HttpStatus.BAD_REQUEST),
    SERVICE_NOT_FOUND(2012, "Service not found", HttpStatus.NOT_FOUND),
    PACKAGE_NOT_FOUND(2013, "Package not found", HttpStatus.NOT_FOUND),
    CATALOG_UNAVAILABLE(2014, "Catalog service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    SERVICE_NOT_AVAILABLE(2015, "Service is not available for ordering", HttpStatus.BAD_REQUEST),
    PACKAGE_NOT_AVAILABLE(2016, "Package is not available for ordering", HttpStatus.BAD_REQUEST),

    ORDER_ADDON_NOT_FOUND(2017, "Addon not found", HttpStatus.NOT_FOUND),
    ORDER_ADDON_NOT_AVAILABLE(2018, "Addon is not available for ordering", HttpStatus.BAD_REQUEST),
    ORDER_ITEM_TOTAL_MISMATCH(2019, "Order items total does not match subtotal", HttpStatus.INTERNAL_SERVER_ERROR),
    ORDER_EXECUTION_NOT_FOUND(2020, "Execution not found for this order", HttpStatus.NOT_FOUND),

    //===========EVIDENCE============
    ORDER_EVIDENCE_NOT_ALLOWED(2021, "Evidence is not allowed at this status", HttpStatus.BAD_REQUEST),
    ORDER_EVIDENCE_PHASE_REQUIRED(2022, "Evidence phase is required", HttpStatus.BAD_REQUEST),
    ORDER_EVIDENCE_FILE_REQUIRED(2023, "Evidence file url is required", HttpStatus.BAD_REQUEST),


    ORDER_BOOKING_SLOT_REQUIRED(3001,"Booking slot is required!" , HttpStatus.NOT_FOUND),
    ORDER_ADDRESS_REQUIRED(3002, "Order Address is required !", HttpStatus.NOT_FOUND ),

    ORDER_CHECKIN_CODE_INVALID(3003, "Checkin code is invalid", HttpStatus.BAD_REQUEST),
    ORDER_CHECKIN_TIME_INVALID(3004, "Checkin time is invalid", HttpStatus.BAD_REQUEST),
    ORDER_EVIDENCE_AFTER_REQUIRED(3005, "At least one AFTER evidence is required", HttpStatus.BAD_REQUEST),

    ORDER_REQUIREMENTS_SUBMITTED(3006, "Requirements already submitted", HttpStatus.CONFLICT),
    ORDER_DELIVERY_FILE_REQUIRED(3007, "At least one delivery file is required", HttpStatus.BAD_REQUEST),
    ORDER_DELIVERY_NOT_FOUND(3008, "Delivery not found", HttpStatus.NOT_FOUND),
    ORDER_REVISION_LIMIT_EXCEEDED(3009, "Revision limit exceeded", HttpStatus.CONFLICT),

    //===========BOOKING SLOT============
    ORDER_SLOT_NOT_FOUND(3010, "Booking slot not found", HttpStatus.NOT_FOUND),
    ORDER_SLOT_NOT_AVAILABLE(3011, "Booking slot is not available", HttpStatus.CONFLICT),
    ORDER_SLOT_NOT_MATCH_SERVICE(3012, "Booking slot does not belong to this service", HttpStatus.BAD_REQUEST),
    ORDER_SLOT_HOLD_EXPIRED(3013, "Booking slot hold has expired, please create a new order", HttpStatus.CONFLICT),

    //===========CANCELLATION============
    ORDER_CANCEL_REASON_REQUIRED(3014, "Cancellation reason is required", HttpStatus.BAD_REQUEST),
    ORDER_CANCELLATION_EXISTED(3015, "This order already has a cancellation request", HttpStatus.CONFLICT),
    ORDER_CANCELLATION_NOT_FOUND(3016, "Cancellation request not found", HttpStatus.NOT_FOUND),
    ORDER_CANCELLATION_NOT_PENDING(3017, "Cancellation request is not pending", HttpStatus.CONFLICT),
    ORDER_CANCELLATION_SELF_RESPOND(3018, "You cannot respond to your own cancellation request", HttpStatus.FORBIDDEN),
    ORDER_CANCEL_ANSWER_REQUIRED(3019, "Accept or reject is required", HttpStatus.BAD_REQUEST),

    //===========PAYMENT============
    ORDER_CHECKIN_CODE_NOT_FOUND(3020, "Checkin code is not available for this order", HttpStatus.NOT_FOUND),
    ORDER_PAYMENT_ID_REQUIRED(3021, "Payment id is required", HttpStatus.BAD_REQUEST),
    PROPOSAL_ORDER_INVALID_REQUEST(3022, "Invalid proposal order request or idempotency key", HttpStatus.BAD_REQUEST),
    PROPOSAL_ORDER_CONFLICT(3023, "Proposal source or order payload does not match", HttpStatus.CONFLICT),
    JOB_SERVICE_UNAVAILABLE(3024, "Job service is unavailable", HttpStatus.SERVICE_UNAVAILABLE);

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
