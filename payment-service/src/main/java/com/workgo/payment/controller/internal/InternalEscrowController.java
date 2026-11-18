package com.workgo.payment.controller.internal;

import com.workgo.payment.dto.request.EscrowAdjustRequest;
import com.workgo.payment.dto.request.EscrowFreezeRequest;
import com.workgo.payment.dto.request.EscrowRefundRequest;
import com.workgo.payment.dto.request.EscrowReleaseRequest;
import com.workgo.payment.dto.request.SettlementCommand;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import com.workgo.payment.dto.response.SettlementResult;
import com.workgo.payment.service.EscrowService;
import com.workgo.payment.service.RefundService;
import com.workgo.payment.service.SettlementService;
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
    SettlementService settlementService;

    @PostMapping("/release")
    EscrowAccountResponse release(@RequestBody EscrowReleaseRequest request) {
        return escrowService.release(request);
    }

    @PostMapping("/refund")
    EscrowAccountResponse refund(@RequestBody EscrowRefundRequest request) {
        return refundService.refundOrder(request);
    }

    //lenh phan quyet: goi lai cung decisionId sau timeout khong chi / hoan them
    @PostMapping("/settle")
    SettlementResult settle(@RequestBody SettlementCommand command) {
        return settlementService.settle(command);
    }

    //phu luc doi gia da 2 ben chot: giu them / hoan phan chenh lech qua vi
    @PostMapping("/adjust")
    EscrowAccountResponse adjust(@RequestBody EscrowAdjustRequest request) {
        return escrowService.adjust(request);
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
