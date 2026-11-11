package com.workgo.payment.controller;

import com.workgo.payment.dto.gateway.VnPayIpnResponse;
import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.service.GatewayCallbackService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

//gateway goi vao (public, check bang chu ky), tra dung format cua tung gateway nen khong boc ApiResponse
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/gateway")
public class GatewayCallbackController {

    GatewayCallbackService gatewayCallbackService;

    @GetMapping("/vnpay/ipn")
    VnPayIpnResponse vnpayIpn(@RequestParam Map<String, String> params) {
        return gatewayCallbackService.handleVnPayIpn(params);
    }

    //trinh duyet cua client duoc vnpay redirect ve -> chuyen tiep sang FE
    @GetMapping("/vnpay/return")
    ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        return redirect(gatewayCallbackService.buildReturnRedirect(PaymentGateway.VNPAY, params));
    }

    //momo gui json, so (amount, transId...) doi ve chuoi de ky lai
    @PostMapping("/momo/ipn")
    ResponseEntity<Void> momoIpn(@RequestBody Map<String, Object> body) {

        Map<String, String> params = new HashMap<>();
        body.forEach((key, value) -> params.put(key, value == null ? null : String.valueOf(value)));

        return ResponseEntity.status(gatewayCallbackService.handleMoMoIpn(params)).build();
    }

    @GetMapping("/momo/return")
    ResponseEntity<Void> momoReturn(@RequestParam Map<String, String> params) {
        return redirect(gatewayCallbackService.buildReturnRedirect(PaymentGateway.MOMO, params));
    }

    //=====================================

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, location)
                .build();
    }

}
