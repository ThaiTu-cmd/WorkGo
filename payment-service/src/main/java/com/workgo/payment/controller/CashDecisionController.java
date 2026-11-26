package com.workgo.payment.controller;
import com.workgo.payment.service.CashDecisionService;import com.workgo.payment.reppository.CashDecisionReceiptRepository;import com.workgo.payment.entity.CashDecisionReceipt;
import com.workgo.payment.dto.request.CashDecisionRequest;import com.workgo.payment.utils.TokenUtils;import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import java.util.UUID;import java.math.BigDecimal;
@RestController @RequiredArgsConstructor
public class CashDecisionController {
 private final CashDecisionService service;private final CashDecisionReceiptRepository receipts;private final TokenUtils tokens;private final com.workgo.payment.service.ProviderAccountService providers;
 @PostMapping("/internal/cash-decisions/cancel")public CashDecisionReceipt cancel(@RequestBody CashDecisionRequest req){return service.cancel(req);}
 public record Return(BigDecimal amount){}
 @PostMapping("/wallet/cash-returns/{id}/confirm")public CashDecisionReceipt confirm(@PathVariable UUID id,@RequestBody Return req){return service.confirmReturn(id,tokens.getCurrentUserId(),req.amount());}
 @GetMapping("/wallet/cash-returns/{orderId}")public CashDecisionReceipt receipt(@PathVariable UUID orderId){var r=receipts.findByOrderId(orderId).orElseThrow(()->new com.workgo.payment.exception.AppException(com.workgo.payment.exception.ErrorCode.PAYMENT_NOT_FOUND));var actor=tokens.getCurrentUserId();if(!actor.equals(r.getClientId())&&!actor.equals(providers.userIdOf(r.getProviderId())))throw new com.workgo.payment.exception.AppException(com.workgo.payment.exception.ErrorCode.FORBIDDEN);return r;}
}
