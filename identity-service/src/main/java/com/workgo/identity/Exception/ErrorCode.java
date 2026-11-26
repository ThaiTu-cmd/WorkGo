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
    SECURITY_SUPPORT_RATE_LIMIT(1090,"Too many support requests; try again later",HttpStatus.TOO_MANY_REQUESTS),
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
    UNAUTHORIZED(1007, "You do not have that permission", HttpStatus.FORBIDDEN),
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

    //===============PROVIDER====================
    PROVIDER_PROFILE_EXISTED(1023, "Provider profile already existed", HttpStatus.BAD_REQUEST),
    PROVIDER_PROFILE_NOT_EXISTED(1024, "Provider profile does not exist", HttpStatus.NOT_FOUND),
    USER_ALREADY_PROVIDER(1025, "This user is already a provider", HttpStatus.BAD_REQUEST),
    RATING_STATS_INVALID(1030, "Rating average must be between 0 and 5 and rating count must not be negative", HttpStatus.BAD_REQUEST),
    RATING_SNAPSHOT_CONFLICT(1031, "Rating version already has a different snapshot", HttpStatus.CONFLICT),
    FINANCIAL_RESTRICTION_INVALID(1050, "Financial restriction must have a status and a positive version", HttpStatus.BAD_REQUEST),

    //===============ACCOUNT ADMIN====================
    REASON_REQUIRED(1032, "Reason is required and must be at most 500 characters", HttpStatus.BAD_REQUEST),
    STALE_VERSION(1033, "Data was changed by someone else, reload and try again", HttpStatus.CONFLICT),
    REAUTHENTICATION_REQUIRED(1034, "Please sign in again to confirm this action", HttpStatus.FORBIDDEN),
    ROLE_NOT_GRANTABLE(1035, "This role cannot be granted or revoked here", HttpStatus.BAD_REQUEST),
    SELF_ACCOUNT_CHANGE_NOT_ALLOWED(1036, "You cannot change your own account here", HttpStatus.FORBIDDEN),
    ROLE_ALREADY_GRANTED(1037, "User already has this role", HttpStatus.CONFLICT),
    ROLE_NOT_GRANTED(1038, "User does not have this role", HttpStatus.CONFLICT),
    LAST_SUPER_ADMIN(1039, "Cannot remove or lock the last active super admin", HttpStatus.CONFLICT),
    INVALID_EXPORT_RANGE(1040, "Export needs from and to, from before to, at most 92 days", HttpStatus.BAD_REQUEST),

    //===============FILE====================
    FILE_REQUIRED(1041, "File is required", HttpStatus.BAD_REQUEST),
    FILE_EMPTY(1042, "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1043, "File is too large", HttpStatus.PAYLOAD_TOO_LARGE),
    FILE_TYPE_NOT_ALLOWED(1044, "File type is not allowed", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    FILE_NOT_FOUND(1045, "File not found", HttpStatus.NOT_FOUND),
    FILE_LINK_INVALID(1046, "Download link is invalid or expired", HttpStatus.FORBIDDEN),
    FILE_STORAGE_ERROR(1047, "Cannot store file", HttpStatus.INTERNAL_SERVER_ERROR),
    VERIFICATION_DOCUMENT_LIMIT(1048, "A verification can have at most 5 documents", HttpStatus.CONFLICT),
    VERIFICATION_NOT_EDITABLE(1049, "Documents can only be added while the verification is pending", HttpStatus.CONFLICT),


    //=================PROVIDER VERIFICATION============
    PROVIDER_VERIFICATION_NOT_EXISTED(1026, "Provider verification does not exist", HttpStatus.NOT_FOUND),
    PROVIDER_VERIFICATION_PENDING(1027, "You already have a pending verification request", HttpStatus.BAD_REQUEST),

    INVALID_STATE_TRANSITION(1028,  "Invalid state transition", HttpStatus.CONFLICT),
    INVALID_CONDITION_PROVIDER(1029,  "User has invalid condition to be a provider", HttpStatus.CONFLICT)

    ;


    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
