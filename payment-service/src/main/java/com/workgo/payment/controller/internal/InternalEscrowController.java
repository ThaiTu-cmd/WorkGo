package com.workgo.payment.controller.internal;

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

//order-service goi (X-Internal-Key)
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/escrows")
public class InternalEscrowController {

    EscrowService escrowService;
    RefundService refundService;

    //order COMPLETED -> tra tien cho provider
    @PostMapping("/release")
    EscrowAccountResponse release(@RequestBody EscrowReleaseRequest request) {
        return escrowService.release(request);
    }

    //order huy don da thanh toan -> hoan tien cho client
    @PostMapping("/refund")
    EscrowAccountResponse refund(@RequestBody EscrowRefundRequest request) {
        return refundService.refundOrder(request);
    }

}
