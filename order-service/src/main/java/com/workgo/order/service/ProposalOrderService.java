package com.workgo.order.service;

import com.workgo.order.dto.request.CreateProposalOrderRequest;
import com.workgo.order.dto.response.ProposalOrderResponse;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProposalOrderService {
    private final ProposalOrderCreator creator;
    private final Validator validator;

    // Keep the concurrency catch outside the transaction that might have been rolled back.
    public CreationResult create(UUID idempotencyKey, CreateProposalOrderRequest request) {
        if (request == null || !validator.validate(request).isEmpty()
                || !request.proposalId().equals(idempotencyKey)) {
            throw new AppException(ErrorCode.PROPOSAL_ORDER_INVALID_REQUEST);
        }
        if (!"DIGITAL".equals(request.executionType())) {
            throw new AppException(ErrorCode.ORDER_EXECUTION_TYPE_NOT_SUPPORTED);
        }
        try {
            return creator.create(request);
        } catch (DataIntegrityViolationException collision) {
            // A concurrent winner is committed when the unique check on its source resolves.
            CreationResult existing = creator.replay(request);
            if (existing != null) return existing;
            throw collision;
        }
    }

    public record CreationResult(ProposalOrderResponse response, boolean created) { }
}
