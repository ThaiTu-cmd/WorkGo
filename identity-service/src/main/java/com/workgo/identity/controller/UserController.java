package com.workgo.identity.controller;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.UserCreationRequest;
import com.workgo.identity.dto.request.UserUpdateRequest;
import com.workgo.identity.dto.response.UserCreationResponse;
import com.workgo.identity.dto.response.UserResponse;
import com.workgo.identity.service.UserService;
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
    public ApiResponse<UserResponse> updateUser(
            @PathVariable UUID userId,
            @RequestBody UserUpdateRequest request
    ){
        return ApiResponse.<UserResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(userService.updateUser(userId, request))
                .build();
    }

    @DeleteMapping("/{userId}")
    public ApiResponse<Void> deleteUser(
            @PathVariable UUID userId
    ){

        userService.deleteUser(userId);

        return ApiResponse.<Void>builder()
                .build();
    }

}
