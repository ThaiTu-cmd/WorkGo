package com.workgo.payment.service;

import com.workgo.payment.dto.response.client.TrustDisputeStatusResponse;
import com.workgo.payment.entity.EscrowAccount;
import com.workgo.payment.enumeration.EscrowStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.client.TrustClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrustDisputeGuard {
    private final TrustClient trustClient;

    /** Caller must hold the escrow lock until its financial transaction commits. */
    public void assertMayTransfer(EscrowAccount escrow, UUID disputeId) {
        if (escrow.getStatus() == EscrowStatus.FROZEN) {
            if (disputeId == null) throw new AppException(ErrorCode.ESCROW_FROZEN);
            if (!disputeId.equals(escrow.getActiveDisputeId())) {
                throw new AppException(ErrorCode.ESCROW_DISPUTE_CONFLICT);
            }
            return; // Existing dispute-resolution path: must own the freeze.
        }
        // Supplying an arbitrary dispute ID must never disable the ordinary guard.
        if (disputeId != null) throw new AppException(ErrorCode.ESCROW_DISPUTE_CONFLICT);
        TrustDisputeStatusResponse result;
        try {
            result = trustClient.getDisputeStatus(escrow.getOrderId());
        } catch (RuntimeException e) {
            throw new AppException(ErrorCode.TRUST_SERVICE_UNAVAILABLE);
        }
        if (result == null || !escrow.getOrderId().equals(result.getOrderId())
                || result.getHasActiveDispute() == null) {
            throw new AppException(ErrorCode.TRUST_SERVICE_UNAVAILABLE);
        }
        if (result.getHasActiveDispute()) {
            if (result.getActiveDisputeId() == null
                    || !("OPEN".equals(result.getStatus()) || "UNDER_REVIEW".equals(result.getStatus()))) {
                throw new AppException(ErrorCode.TRUST_SERVICE_UNAVAILABLE);
            }
            throw new AppException(ErrorCode.ESCROW_FROZEN);
        }
        if (result.getActiveDisputeId() != null || result.getStatus() != null) {
            throw new AppException(ErrorCode.TRUST_SERVICE_UNAVAILABLE);
        }
    }
}
