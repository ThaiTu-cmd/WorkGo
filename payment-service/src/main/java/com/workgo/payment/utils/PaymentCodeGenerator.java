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

    public static final String TOP_UP_PREFIX = "TOP";

    public static final String PAYOUT_PREFIX = "OUT";

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        return generate("PAY");
    }

    public String generateTopUp() {
        return generate(TOP_UP_PREFIX);
    }

    public String generatePayout() {
        return generate(PAYOUT_PREFIX);
    }

    private String generate(String prefix) {
        return prefix + FORMATTER.format(Instant.now())
                + String.format("%06d", random.nextInt(1_000_000));
    }

}
