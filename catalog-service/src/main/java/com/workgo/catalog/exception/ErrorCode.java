package com.workgo.catalog.exception;

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

    //===============CATEGORY===================
    CATEGORY_EXISTED(1008, "Category is already existed ", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXISTED(1009, "Category is not existed !", HttpStatus.BAD_REQUEST),
    PARENT_CATEGORY_NOT_EXISTED(1010, "The parent of this category is not existed", HttpStatus.BAD_REQUEST),

    //===============SERVICE==============================
    SERVICE_EXISTED(1011, "This service is already existed !", HttpStatus.BAD_REQUEST),
    SERVICE_NOT_EXISTED(1012, "This service is not existed !", HttpStatus.BAD_REQUEST),

    //===============PACKAGE==============================
    PACKAGE_EXISTED(1013, "This package name already exists in this service !", HttpStatus.BAD_REQUEST),
    PACKAGE_NOT_EXISTED(1014, "This package does not exist !", HttpStatus.NOT_FOUND),

    //===============MEDIA==============================
    MEDIA_EXISTED(1015, "This media URL already exists in this service !", HttpStatus.BAD_REQUEST),
    MEDIA_NOT_EXISTED(1016, "This media does not exist !", HttpStatus.NOT_FOUND),
    INVALID_START_END_TIME(1017, "The values of start/ end time is invalid", HttpStatus.CONFLICT),

    //==============AVAILABLE RULE========================
    RULE_NOT_EXISTED(1018, "This rule is not existed", HttpStatus.NOT_FOUND),

    //=================ADD ON=====================
    ADD_ON_NOT_EXISTED(1019, "This add-on is not existed", HttpStatus.NOT_FOUND),


    //=============BOOKING SLOT=============
    SLOT_NOT_EXISTED(1020, "This slot does not exist", HttpStatus.NOT_FOUND),
    SLOT_NOT_AVAILABLE(1021, "This slot is not available", HttpStatus.CONFLICT),
    SLOT_IN_PAST(1022, "This slot is in the past", HttpStatus.CONFLICT),
    SLOT_NOT_HELD_BY_ORDER(1023, "This slot is not held by this order", HttpStatus.CONFLICT),
    SLOT_CONFLICT(1024, "Slot was just taken, please retry", HttpStatus.CONFLICT),
    ;

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
