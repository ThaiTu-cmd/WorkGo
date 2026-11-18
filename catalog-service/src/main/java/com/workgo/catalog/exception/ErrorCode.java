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

    //===============AUDIT====================
    INVALID_EXPORT_RANGE(1050, "Export needs from and to, from before to, at most 92 days", HttpStatus.BAD_REQUEST),

    //===============FILE====================
    FILE_REQUIRED(1051, "File is required", HttpStatus.BAD_REQUEST),
    FILE_EMPTY(1052, "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1053, "File is too large", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_TYPE_NOT_ALLOWED(1054, "File type is not allowed", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    FILE_STORAGE_ERROR(1055, "Cannot store file", HttpStatus.INTERNAL_SERVER_ERROR),
    MEDIA_URL_INVALID(1056, "Media url must be https and uploaded media url cannot be changed", HttpStatus.BAD_REQUEST),
    MEDIA_LIMIT(1057, "A service can have at most 20 media", HttpStatus.CONFLICT),

    //===============USER====================
    USER_EXISTED(1001, "User existed", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1002,"Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 5 characters", HttpStatus.BAD_REQUEST),
    INVALID_KEY(1004, "Invalid message key", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1005, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    USER_NOT_EXISTED(1006, "User dose not exist", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(1007, "You do not have that permission", HttpStatus.FORBIDDEN),

    //===============CATEGORY===================
    CATEGORY_EXISTED(1008, "Category is already existed ", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXISTED(1009, "Category is not existed !", HttpStatus.BAD_REQUEST),
    PARENT_CATEGORY_NOT_EXISTED(1010, "The parent of this category is not existed", HttpStatus.BAD_REQUEST),

    //===============SERVICE==============================
    SERVICE_EXISTED(1011, "This service is already existed !", HttpStatus.BAD_REQUEST),
    SERVICE_NOT_EXISTED(1012, "This service is not existed !", HttpStatus.BAD_REQUEST),
    NOT_SERVICE_OWNER(1025, "You are not the owner of this service", HttpStatus.FORBIDDEN),
    INVALID_SERVICE_STATUS(1026, "The service status is invalid", HttpStatus.BAD_REQUEST),
    RATING_STATS_INVALID(1029, "Average rating must be between 0 and 5 and review count must not be negative", HttpStatus.BAD_REQUEST),
    RATING_SNAPSHOT_CONFLICT(1030, "Rating version already has a different snapshot", HttpStatus.CONFLICT),
    PROVIDER_FINANCIALLY_RESTRICTED(1058, "Provider cannot publish services until the wallet debt is paid", HttpStatus.CONFLICT),
    FINANCIAL_RESTRICTION_INVALID(1059, "Financial restriction must have a status and a positive version", HttpStatus.BAD_REQUEST),

    //===============PACKAGE==============================
    PACKAGE_EXISTED(1013, "This package name already exists in this service !", HttpStatus.BAD_REQUEST),
    PACKAGE_NOT_EXISTED(1014, "This package does not exist !", HttpStatus.NOT_FOUND),

    //===============MEDIA==============================
    MEDIA_EXISTED(1015, "This media URL already exists in this service !", HttpStatus.BAD_REQUEST),
    MEDIA_NOT_EXISTED(1016, "This media does not exist !", HttpStatus.NOT_FOUND),
    INVALID_START_END_TIME(1017, "The values of start/ end time is invalid", HttpStatus.CONFLICT),

    //==============AVAILABLE RULE========================
    RULE_NOT_EXISTED(1018, "This rule is not existed", HttpStatus.NOT_FOUND),
    INVALID_SLOT_DURATION(1027, "The slot duration must be greater than 0", HttpStatus.BAD_REQUEST),
    INVALID_DAY_OF_WEEK(1028, "The day of week must be from 2 (Monday) to 8 (Sunday)", HttpStatus.BAD_REQUEST),

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
