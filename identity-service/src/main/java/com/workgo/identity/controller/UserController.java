package com.workgo.identity.controller;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.AccountLockRequest;
import com.workgo.identity.dto.request.AdminUserUpdateRequest;
import com.workgo.identity.dto.request.RoleChangeRequest;
import com.workgo.identity.dto.request.UserCreationRequest;
import com.workgo.identity.dto.request.UserUpdateRequest;
import com.workgo.identity.dto.response.UserCreationResponse;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.service.UserService;
import com.workgo.identity.service.admin.AccountAdminService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserController {

    UserService userService;
    AccountAdminService accountAdminService;

    @PostMapping("/registration")
    ApiResponse<UserCreationResponse> createUser(@RequestBody @Valid UserCreationRequest request){

        return ApiResponse.<UserCreationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(userService.createUser(request))
                .build();
    }

    @GetMapping("/myInfo")
    ApiResponse<UserResponse> getMyInfo(){
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(userService.getMyInfo())
                .build();
    }

    @GetMapping
    ApiResponse<PageResponse<UserResponse>> getUsers(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size
    ){
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(userService.getUsers(page, size))
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(
            @PathVariable UUID userId
            ){
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(userService.getUser(userId))
                .build();
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(
            @PathVariable UUID userId,
            @RequestBody AdminUserUpdateRequest request
    ){
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(accountAdminService.updateUser(userId, request))
                .build();
    }

    @PostMapping("/{userId}/roles/grant")
    ApiResponse<UserResponse> grantRole(
            @PathVariable UUID userId,
            @RequestBody RoleChangeRequest request
    ){
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(accountAdminService.grantRole(userId, request))
                .build();
    }

    @PostMapping("/{userId}/roles/revoke")
    ApiResponse<UserResponse> revokeRole(
            @PathVariable UUID userId,
            @RequestBody RoleChangeRequest request
    ){
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(accountAdminService.revokeRole(userId, request))
                .build();
    }

    @PutMapping("/myInfo")
    ApiResponse<UserResponse> updateMyInfo(
            @RequestBody UserUpdateRequest request
    ) {
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(userService.updateMyInfo(request))
                .build();
    }

    @DeleteMapping("/{userId}")
    ApiResponse<Void> deleteUser(
            @PathVariable UUID userId,
            @RequestBody AccountLockRequest request
    ){

        accountAdminService.lockUser(userId, request);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }

}
