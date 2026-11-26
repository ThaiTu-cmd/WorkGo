package com.workgo.order.controller;
import com.workgo.order.service.OrderRewardQuoteService;import com.workgo.order.reppository.*;import com.workgo.order.utils.TokenUtils;
import com.workgo.order.dto.ApiResponse;import com.workgo.order.exception.*;import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import java.util.UUID;
@RestController @RequiredArgsConstructor
public class OrderRewardPreviewController {
 private final OrderRepository orders;private final OrderSnapshotRepository snapshots;private final OrderAgreementVersionRepository agreements;
 private final OrderAmendmentRepository amendments;
 private final TokenUtils token;private final OrderRewardQuoteService quotes;
 @GetMapping("/orders/{id}/reward-quote") public ApiResponse<OrderRewardQuoteService.Quote> get(@PathVariable UUID id){
  var order=orders.findById(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));token.assertParticipant(order);
  String ref=agreements.findTopByOrderIdOrderByVersionNoDesc(id).map(com.workgo.order.entity.OrderAgreementVersion::getRewardQuoteRef).orElseGet(()->snapshots.findById(id).map(com.workgo.order.entity.OrderSnapshot::getRewardQuoteRef).orElse(null));
  if(ref==null)throw new AppException(ErrorCode.ORDER_INPUTS_STALE);
  return ApiResponse.<OrderRewardQuoteService.Quote>builder().code(1000).result(quotes.historic(ref)).build();
 }
 @GetMapping("/orders/{id}/amendments/{amendmentId}/reward-quote") public ApiResponse<OrderRewardQuoteService.Quote> amendment(@PathVariable UUID id,@PathVariable UUID amendmentId){
  var order=orders.findById(id).orElseThrow(()->new AppException(ErrorCode.ORDER_NOT_FOUND));token.assertParticipant(order);
  var a=amendments.findByAmendmentIdAndOrderId(amendmentId,id).orElseThrow(()->new AppException(ErrorCode.ORDER_AMENDMENT_NOT_FOUND));
  if(a.getRewardQuoteRef()==null)throw new AppException(ErrorCode.ORDER_INPUTS_STALE);
  return ApiResponse.<OrderRewardQuoteService.Quote>builder().code(1000).result(quotes.historic(a.getRewardQuoteRef())).build();
 }
}
