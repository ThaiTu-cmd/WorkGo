package com.workgo.payment.service;

import com.workgo.payment.entity.Payment;
import com.workgo.payment.enumeration.PaymentStatus;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class PaymentStatusService {

    //chuyen trang thai payment, noi goi tu save
    public void transition(Payment payment, PaymentStatus toStatus) {

        if (!payment.getStatus().canTransitionTo(toStatus)) {
            throw new AppException(ErrorCode.PAYMENT_INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();

        if (toStatus == PaymentStatus.SUCCEEDED) {
            payment.setPaidAt(now);
        }

        payment.setStatus(toStatus);
        payment.setUpdatedAt(now);
    }

}
