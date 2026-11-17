package com.workgo.payment.configuration;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.vnpay")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VnPayProperties {

    String tmnCode;

    String hashSecret;

    String payUrl;

    String apiUrl;

    String returnUrl;

}
