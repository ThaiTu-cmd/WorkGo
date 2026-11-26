package com.workgo.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.payment.dto.request.PayoutCreationRequest;
import com.workgo.payment.entity.WalletPayout;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.utils.HmacUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

/** Boundary for an authenticated bank/verification adapter. No configured source means fail closed. */
@Service
public class PayoutSourceVerifier {
    private final String secret;
    private final String merchant;
    private final ObjectMapper json = new ObjectMapper();
    @org.springframework.beans.factory.annotation.Autowired private com.workgo.payment.reppository.VerifiedBeneficiaryRepository beneficiaries;
    public PayoutSourceVerifier(@Value("${payment.payout.verification-secret:}") String secret,
                               @Value("${payment.payout.merchant:}") String merchant) {
        this.secret = secret; this.merchant = merchant;
    }
    public String hash(UUID user, long amount, PayoutCreationRequest r) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(
                Arrays.asList(user.toString(), amount, "VND", r.getVerifiedBeneficiaryId(),
                    trim(r.getBankCode()), trim(r.getAccountNumber()), trim(r.getAccountName())))));
        } catch (Exception e) { throw invalid(); }
    }
    public void verifyBeneficiary(UUID user, PayoutCreationRequest r) {
        if(user==null||r==null||trim(r.getBankCode())==null||trim(r.getAccountNumber())==null||trim(r.getAccountName())==null)throw invalid();
        if(r.getBeneficiaryEvidence()==null && beneficiaries!=null && r.getVerifiedBeneficiaryId()!=null){
            var b=beneficiaries.findById(r.getVerifiedBeneficiaryId()).orElseThrow(this::invalid);
            if(!user.equals(b.getUserId())||!b.getExpiresAt().isAfter(Instant.now())||!b.getBankCode().equals(trim(r.getBankCode()))
                    ||!b.getAccountNumber().equals(trim(r.getAccountNumber()))||!b.getAccountName().equals(trim(r.getAccountName())))throw invalid();
            return;
        }
        var e = verified(r.getBeneficiaryEvidence());
        if (r.getVerifiedBeneficiaryId() == null) throw invalid();
        require(e, "kind", "BENEFICIARY"); require(e, "status", "VERIFIED");
        require(e, "userId", user.toString()); require(e, "beneficiaryId", r.getVerifiedBeneficiaryId().toString());
        require(e, "bankCode", trim(r.getBankCode())); require(e, "accountNumber", trim(r.getAccountNumber()));
        require(e, "accountName", trim(r.getAccountName()));
        try { if (!Instant.parse(e.get("expiresAt")).isAfter(Instant.now())) throw invalid(); }
        catch (Exception ex) { throw invalid(); }
    }
    public void verifyResult(WalletPayout p, Map<String,String> evidence, String ref, boolean paid) {
        var e = verified(evidence);
        require(e,"kind","PAYOUT"); require(e,"payoutCode",p.getPayoutCode());
        require(e,"userId",p.getUserId().toString());
        if (p.getVerifiedBeneficiaryId() == null) {
            // Legacy held commands keep their original destination; the bank adapter must explicitly reverify ownership.
            require(e,"legacyBeneficiaryVerified","true");
            try{UUID.fromString(e.get("beneficiaryId"));}catch(Exception ex){throw invalid();}
        } else require(e,"beneficiaryId",p.getVerifiedBeneficiaryId().toString());
        require(e,"bankCode",p.getBankCode()); require(e,"accountNumber",p.getAccountNumber());
        require(e,"accountName",p.getAccountName()); require(e,"currency",p.getCurrency());
        require(e,"amount",Long.toString(p.getAmount())); require(e,"transactionId",ref);
        if (paid) require(e,"status","PAID");
        else if (!Set.of("NOT_PAID","RETURNED").contains(e.get("status"))) throw invalid();
        try { if (Instant.parse(e.get("verifiedAt")).isAfter(Instant.now().plusSeconds(60))) throw invalid(); }
        catch (Exception ex) { throw invalid(); }
    }
    public String evidenceHash(Map<String,String> evidence){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(new TreeMap<>(evidence))));}catch(Exception e){throw invalid();}}
    private Map<String,String> verified(Map<String,String> evidence) {
        if (secret == null || secret.length() < 32 || merchant == null || merchant.isBlank()) throw invalid();
        try {
            var fields = new TreeMap<>(evidence); String signature = fields.remove("signature");
            String expected = HmacUtils.hmacSha512(secret, json.writeValueAsString(fields));
            if (signature == null || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8))) throw invalid();
            require(fields,"merchant",merchant); return fields;
        } catch (Exception e) { throw invalid(); }
    }
    private void require(Map<String,String> fields, String key, String value) {
        if (value == null || value.isBlank() || !value.equals(fields.get(key))) throw invalid();
    }
    private String trim(String value) { return value == null ? null : value.trim(); }
    private AppException invalid() { return new AppException(ErrorCode.PAYOUT_REFERENCE_REQUIRED); }
}
