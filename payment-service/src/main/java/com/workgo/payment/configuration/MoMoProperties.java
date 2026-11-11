package com.workgo.payment.configuration;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

//doc nhom payment.momo trong application.yaml
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "payment.momo")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoMoProperties {

    String partnerCode;

    String accessKey;

    String secretKey;

    String endpoint;

    String redirectUrl;

    String ipnUrl;

}
