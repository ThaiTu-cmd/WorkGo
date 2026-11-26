package com.workgo.payment.service;
import com.workgo.payment.dto.request.CashDecisionRequest;import com.workgo.payment.entity.*;import com.workgo.payment.reppository.*;
import com.workgo.payment.reppository.client.OrderClient;import com.workgo.payment.enumeration.*;import com.workgo.payment.exception.*;
import com.workgo.payment.service.wallet.*;import com.fasterxml.jackson.databind.ObjectMapper;import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import java.util.*;import java.math.BigDecimal;
@Service @RequiredArgsConstructor
public class CashDecisionService {
 private final CashDecisionReceiptRepository receipts;private final FeeAssessmentRepository fees;private final FeePolicyService policies;
 private final WalletService wallet;private final WalletOrderSettlementService postings;private final ProviderAccountService providers;
 private final FeeReceivableService receivables;private final FeeReminderService reminders;private final OrderClient orders;private final ObjectMapper json;
 @Transactional public CashDecisionReceipt cancel(CashDecisionRequest r){
  if(r==null||r.decisionId()==null||!r.decisionId().equals(r.cashOutcomeId())||r.disputeId()==null||r.orderId()==null)throw invalid();
  String hash;
  try{hash=java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(r)));}catch(Exception e){throw invalid();}
  var old=receipts.findById(r.decisionId()).orElse(null);
  if(old!=null){if(!hash.equals(old.getPayloadHash()))throw new AppException(ErrorCode.SETTLEMENT_CONFLICT);return old;}
  if(!"CASH".equals(r.paymentMethod())||!"REFUND".equals(r.operation())||!Boolean.FALSE.equals(r.workAccepted())||r.paymentReceived()==null
    ||r.decidedBy()==null||r.effectiveAt()==null||r.effectiveAt().isAfter(java.time.Instant.now())||r.clientId()==null||r.providerId()==null
    ||!"VND".equals(r.currency())||r.totalAmount()==null||r.totalAmount().signum()<=0||r.totalAmount().scale()>0||r.totalAmount().compareTo(BigDecimal.valueOf(2000000))>0
    ||r.actualReceivedAmount()==null||r.actualReceivedAmount().signum()<0||r.actualReceivedAmount().scale()>0||r.actualReceivedAmount().compareTo(r.totalAmount())>0
    ||!Set.of("NONE","CLIENT","PROVIDER").contains(r.branch())||r.feePolicyVersionId()==null)throw invalid();
  var source=orders.getPaymentInfo(r.orderId());
  if(source==null||!r.orderId().equals(source.getOrderId())||!r.clientId().equals(source.getClientId())||!r.providerId().equals(source.getProviderId())
    ||source.getPaymentMethod()!=com.workgo.payment.enumeration.client.OrderPaymentMethod.CASH||source.getExecutionType()!=com.workgo.payment.enumeration.client.ExecutionType.ONSITE
    ||source.getOrderStatus()==null||!Set.of("CONFIRMED","IN_PROGRESS","DELIVERED").contains(source.getOrderStatus().name())||source.getTotalAmount().compareTo(r.totalAmount())!=0
    ||!Objects.equals(source.getFeePolicyVersionId(),r.feePolicyVersionId()))throw invalid();
  UUID providerUser=providers.userIdOf(r.providerId());
  UUID charged="CLIENT".equals(r.branch())?r.clientId():"PROVIDER".equals(r.branch())?providerUser:null;
  java.util.stream.Stream.of(providerUser,charged).filter(Objects::nonNull).distinct().sorted().forEach(user->wallet.lockedBalanceOf(WalletAccountRef.userAvailable(user)));
  old=receipts.findById(r.decisionId()).orElse(null);
  if(old!=null){if(!hash.equals(old.getPayloadHash()))throw new AppException(ErrorCode.SETTLEMENT_CONFLICT);return old;}
  if(receipts.findByOrderId(r.orderId()).isPresent()||fees.existsByOrderId(r.orderId()))throw new AppException(ErrorCode.SETTLEMENT_ORDER_SETTLED);
  var policy=policies.loadForOrder(r.feePolicyVersionId());long fee="NONE".equals(r.branch())?0:policies.cancellationFee(policy,r.totalAmount().longValueExact());
  long available=charged==null?0:wallet.lockedBalanceOf(WalletAccountRef.userAvailable(charged));long collected=Math.min(fee,Math.max(0,available));
  var assessment=fees.saveAndFlush(FeeAssessment.builder().orderId(r.orderId()).decisionId(r.decisionId()).feeType(FeeType.CANCELLATION)
    .chargedParty(FeeChargedParty.valueOf(r.branch())).chargedUserId(charged).feePolicyVersionId(r.feePolicyVersionId())
    .baseAmount(r.totalAmount().longValueExact()).amount(fee).collectedAmount(0L).status(fee==0?FeeAssessmentStatus.WAIVED:FeeAssessmentStatus.OUTSTANDING).build());
  if(collected>0){assessment.setCollectTransactionId(postings.collectReceivable(assessment,charged,collected));assessment.setCollectedAmount(collected);}
  assessment.setStatus(fee==0?FeeAssessmentStatus.WAIVED:collected==fee?FeeAssessmentStatus.COLLECTED:FeeAssessmentStatus.OUTSTANDING);fees.saveAndFlush(assessment);
  if(assessment.getStatus()==FeeAssessmentStatus.OUTSTANDING)reminders.enqueue(assessment);
  if(charged!=null)receivables.refreshRestriction(charged);
  var receipt=new CashDecisionReceipt();receipt.setDecisionId(r.decisionId());receipt.setOrderId(r.orderId());receipt.setDisputeId(r.disputeId());receipt.setClientId(r.clientId());receipt.setProviderId(r.providerId());receipt.setPayloadHash(hash);
  receipt.setFeeAssessmentId(assessment.getFeeAssessmentId());receipt.setFeePolicyVersionId(r.feePolicyVersionId());receipt.setOrderAmount(r.totalAmount().longValueExact());receipt.setFeeAmount(fee);receipt.setCashReturnDue(r.actualReceivedAmount().longValueExact());receipt.setStatus(receipt.getCashReturnDue()==0?"COMPLETED":"AWAITING_CASH_RETURN");return receipts.saveAndFlush(receipt);
 }
 @Transactional public CashDecisionReceipt confirmReturn(UUID id,UUID actor,BigDecimal amount){
  var r=receipts.lock(id).orElseThrow(()->new AppException(ErrorCode.PAYMENT_NOT_FOUND));
  if(!actor.equals(r.getClientId()))throw new AppException(ErrorCode.FORBIDDEN);
  if(amount==null||amount.compareTo(BigDecimal.valueOf(r.getCashReturnDue()))!=0)throw invalid();
  if(r.getCashReturnDue()==0)return r;
  if(r.getReturnConfirmedAt()==null){r.setReturnConfirmedAt(java.time.Instant.now());r.setReturnConfirmedBy(actor);r.setStatus("COMPLETED");receipts.save(r);}return r;
 }
 private AppException invalid(){return new AppException(ErrorCode.CASH_FEE_INVALID);}
}
