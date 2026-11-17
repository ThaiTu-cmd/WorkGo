package com.workgo.payment.controller.internal;

import com.workgo.payment.dto.request.EscrowFreezeRequest;
import com.workgo.payment.dto.request.EscrowRefundRequest;
import com.workgo.payment.dto.request.EscrowReleaseRequest;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.service.EscrowService;
import com.workgo.payment.service.RefundService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/escrows")
public class InternalEscrowController {

    EscrowService escrowService;
    RefundService refundService;

    @PostMapping("/release")
    EscrowAccountResponse release(@RequestBody EscrowReleaseRequest request) {
        return escrowService.release(request);
    }

    @PostMapping("/refund")
    EscrowAccountResponse refund(@RequestBody EscrowRefundRequest request) {
        return refundService.refundOrder(request);
    }

    @PostMapping("/freeze")
    EscrowAccountResponse freeze(@RequestBody EscrowFreezeRequest request) {
        return escrowService.freeze(request);
    }

    @PostMapping("/unfreeze")
    EscrowAccountResponse unfreeze(@RequestBody EscrowFreezeRequest request) {
        return escrowService.unfreeze(request);
    }

}
