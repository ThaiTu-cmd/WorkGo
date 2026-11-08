package com.workgo.payment.utils;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Component
public class PaymentCodeGenerator {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter
            .ofPattern("yyMMddHHmmss")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        return "PAY" + FORMATTER.format(Instant.now())
                + String.format("%06d", random.nextInt(1_000_000));
    }

}
