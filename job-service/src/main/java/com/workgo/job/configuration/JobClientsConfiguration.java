package com.workgo.job.configuration;

import com.workgo.job.repository.client.CatalogClient;
import com.workgo.job.repository.client.IdentityClient;
import com.workgo.job.repository.client.OrderClient;
import com.workgo.job.repository.client.PaymentClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableFeignClients(clients = {CatalogClient.class, IdentityClient.class, OrderClient.class,PaymentClient.class})
public class JobClientsConfiguration {
}
