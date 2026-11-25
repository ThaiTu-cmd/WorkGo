package com.workgo.order.configuration;
import org.springframework.context.annotation.*;
import java.time.Clock;
@Configuration
public class OrderClockConfiguration {
    @Bean public Clock orderClock() { return Clock.systemUTC(); }
}
