package com.workgo.order.controller;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.CheckinRequest;
import com.workgo.order.dto.response.CheckinCodeResponse;
import com.workgo.order.dto.response.OnsiteExecutionResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.OnsiteFlowService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/orders/onsite")
public class OnsiteOrderController {

    OnsiteFlowService onsiteFlowService;

    @GetMapping("/{orderId}/checkin-code")
    ApiResponse<CheckinCodeResponse> getCheckinCode(@PathVariable UUID orderId) {

        return ApiResponse.<CheckinCodeResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(onsiteFlowService.getCheckinCode(orderId))
                .build();
    }

    //provider checkin da toi
    @PostMapping("/{orderId}/checkin")
    ApiResponse<OnsiteExecutionResponse> checkin(
            @PathVariable UUID orderId,
            @RequestBody CheckinRequest request
            ){

        return ApiResponse.<OnsiteExecutionResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(onsiteFlowService.checkin(orderId, request))
                .build();
    }

    //provider bao xong viec
    @PostMapping("/{orderId}/complete")
    ApiResponse<OnsiteExecutionResponse> complete(@PathVariable UUID orderId) {

        return ApiResponse.<OnsiteExecutionResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(onsiteFlowService.complete(orderId))
                .build();
    }

    //provider xac nhan da nhan du tien mat (chi don CASH)
    @PostMapping("/{orderId}/cash-received")
    ApiResponse<OnsiteExecutionResponse> confirmCashReceived(@PathVariable UUID orderId, @RequestBody(required=false) CashReceipt request) {

        return ApiResponse.<OnsiteExecutionResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(onsiteFlowService.confirmCashReceived(orderId,request==null?null:request.amount()))
                .build();
    }

    public record CashReceipt(java.math.BigDecimal amount) {}

    @PostMapping("/{orderId}/cash-paid")
    ApiResponse<OnsiteExecutionResponse> cashPaid(@PathVariable UUID orderId,@RequestBody CashReceipt request) {
        return ApiResponse.<OnsiteExecutionResponse>builder().result(onsiteFlowService.recordClientCashPaid(orderId,request.amount())).build();
    }

    //client duyet complete cua provider
    @PostMapping("/{orderId}/accept")
    ApiResponse<OnsiteExecutionResponse> accept(@PathVariable UUID orderId) {

        return ApiResponse.<OnsiteExecutionResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(onsiteFlowService.accept(orderId))
                .build();
    }


}
