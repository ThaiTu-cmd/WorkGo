package com.workgo.identity.controller;

import com.nimbusds.jose.JOSEException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.request.AuthenticationRequest;
import com.workgo.identity.dto.request.IntrospectRequest;
import com.workgo.identity.dto.request.LogoutRequest;
import com.workgo.identity.dto.response.AuthenticationResponse;
import com.workgo.identity.dto.response.IntrospectResponse;
import com.workgo.identity.service.AuthenticationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.apache.kafka.shaded.com.google.protobuf.Api;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuthenticationController {

    AuthenticationService authenticationService;

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request
            ) throws JOSEException {
        return ApiResponse.<AuthenticationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(authenticationService.authenticate(request))
                .build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(
            @RequestBody IntrospectRequest request
            ){
        return ApiResponse.<IntrospectResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(authenticationService.introspect(request))
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout( @RequestBody LogoutRequest request){
        authenticationService.logout(request);

        return ApiResponse.<Void>builder().build();
    }


}
