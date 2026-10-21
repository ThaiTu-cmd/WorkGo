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
    ORDER_ADDRESS_REQUIRED(3002, "Order Address is required !", HttpStatus.NOT_FOUND );


    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
