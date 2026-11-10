package com.workgo.payment.controller;

import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.service.EscrowService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/escrows")
public class EscrowController {

    EscrowService escrowService;

    @GetMapping("/orders/{orderId}")
    ApiResponse<EscrowAccountResponse> getEscrowOfOrder(@PathVariable UUID orderId) {

        return ApiResponse.<EscrowAccountResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(escrowService.getEscrowOfOrder(orderId))
                .build();
    }

}
