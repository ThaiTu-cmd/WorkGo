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

    ;

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
