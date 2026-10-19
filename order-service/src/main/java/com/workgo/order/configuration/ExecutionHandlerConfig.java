package com.workgo.order.configuration;

import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.service.handler.ExecutionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
public class ExecutionHandlerConfig {

    @Bean
    Map<ExecutionType, ExecutionHandler> executionHandlers(List<ExecutionHandler> handlers){
        return handlers.stream()
                .collect(Collectors.toUnmodifiableMap(ExecutionHandler::supports, Function.identity()));
    }

}
