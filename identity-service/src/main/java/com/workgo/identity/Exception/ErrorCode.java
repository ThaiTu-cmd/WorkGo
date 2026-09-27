package com.workgo.identity.Exception;

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
    DISPLAYNAME_INVALID(1008, "DisplayName must be at least 5 characters", HttpStatus.BAD_REQUEST),
    USERNAME_EXISTED(1009, "UserName has already existed !", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_BLANK(1010, "Password must not be blank", HttpStatus.BAD_REQUEST),
    DISPLAYNAME_NOT_BLANK(1011, "DisplayName must not be blank", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_BLANK(1012, "Email must not be blank", HttpStatus.BAD_REQUEST),
    EMAIL_MAX_SIZE(1013, "Email at maximum 30 characters", HttpStatus.BAD_REQUEST),
    PHONE_NOT_BLANK(1014, "Phone must not be blank", HttpStatus.BAD_REQUEST),
    PHONE_SIZE(1015, "Phone size must between 10 and 11 numbers", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1018, "Email already in use", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1019, "Phone number already in use", HttpStatus.BAD_REQUEST),
    WRONG_PASSWORD(1020, "Current password is incorrect", HttpStatus.BAD_REQUEST),
    ROLE_NOT_EXISTED(1021, "This role is not existed", HttpStatus.BAD_REQUEST),

    ADDRESS_NOT_EXISTED(1022, "This address is not existed", HttpStatus.BAD_REQUEST),
    ;

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
