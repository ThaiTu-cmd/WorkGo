package com.workgo.order.controller.internal;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.CreateProposalOrderRequest;
import com.workgo.order.dto.response.ProposalOrderResponse;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.service.ProposalOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.UUID;

@RestController
@RequestMapping("/internal/orders/from-proposal")
@RequiredArgsConstructor
public class ProposalOrderController {
    private final ProposalOrderService service;
    private final com.workgo.order.service.ProposalOrderCreator quotes;
    @PostMapping("/reward-quote") public ApiResponse<com.workgo.order.service.OrderRewardQuoteService.Quote> quote(@Valid @RequestBody CreateProposalOrderRequest request){return ApiResponse.<com.workgo.order.service.OrderRewardQuoteService.Quote>builder().code(1000).result(quotes.preview(request)).build();}
    @PostMapping("/reward-quote/check") public ApiResponse<com.workgo.order.service.OrderRewardQuoteService.Quote> check(@Valid @RequestBody CreateProposalOrderRequest request){return ApiResponse.<com.workgo.order.service.OrderRewardQuoteService.Quote>builder().code(1000).result(quotes.checkQuote(request)).build();}

    @PostMapping
    public ResponseEntity<ProposalOrderResponse> create(@RequestHeader("Idempotency-Key") UUID key,
                                                       @Valid @RequestBody CreateProposalOrderRequest request) {
        var result = service.create(key, request);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.response());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentNotValidException.class,
            MissingRequestHeaderException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiResponse<Void>> invalidRequest(Exception ignored) {
        var error = ErrorCode.PROPOSAL_ORDER_INVALID_REQUEST;
        return ResponseEntity.badRequest().body(ApiResponse.<Void>builder().code(error.getCode()).message(error.getMessage()).build());
    }
}
