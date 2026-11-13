package com.workgo.communication.configuration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(WebSocketProperties.class)
public class WebSocketInfrastructureConfig {
    @Bean
    ThreadPoolTaskExecutor webSocketValidationExecutor(WebSocketProperties properties) {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(properties.getValidationThreads());
        executor.setMaxPoolSize(properties.getValidationThreads());
        executor.setQueueCapacity(properties.getValidationQueueCapacity());
        executor.setThreadNamePrefix("ws-token-validation-");
        return executor;
    }

    @Bean
    ThreadPoolTaskScheduler webSocketHeartbeatScheduler() {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        return scheduler;
    }
}
