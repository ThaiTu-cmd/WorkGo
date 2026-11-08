package com.workgo.payment.configuration;

import com.workgo.payment.enumeration.PaymentGateway;
import com.workgo.payment.service.gateway.PaymentGatewayClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
public class GatewayClientConfig {

    @Bean
    Map<PaymentGateway, PaymentGatewayClient> gatewayClients(List<PaymentGatewayClient> clients){
        return clients.stream()
                .collect(Collectors.toUnmodifiableMap(PaymentGatewayClient::supports, Function.identity()));
    }

}
