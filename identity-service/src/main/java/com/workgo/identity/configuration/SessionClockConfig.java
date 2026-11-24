package com.workgo.identity.configuration;

import org.springframework.context.annotation.*;
import java.time.Clock;

@Configuration
public class SessionClockConfig {
    @Bean public Clock sessionClock() { return Clock.systemUTC(); }
}
