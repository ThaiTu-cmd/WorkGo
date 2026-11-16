package com.workgo.communication.configuration;

import com.workgo.communication.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.time.Clock;
import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }

    @Bean
    @Order(1)
    SecurityFilterChain internalSecurity(HttpSecurity http, JwtAuthenticationEntryPoint entryPoint,
            @Value("${app.internal-api-key:}") String internalKey) throws Exception {
        return http.securityMatcher("/internal/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .exceptionHandling(errors -> errors.authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler((request, response, error) -> entryPoint.write(response, ErrorCode.UNAUTHORIZED)))
                .addFilterBefore(new InternalApiKeyFilter(internalKey, entryPoint), AnonymousAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth.anyRequest().hasAuthority("INTERNAL_SERVICE"))
                .build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain apiSecurity(HttpSecurity http, CustomJwtDecoder decoder,
            JwtAuthenticationEntryPoint entryPoint, JwtAuthenticationConverter converter) throws Exception {
        RequestMatcher handshake = request -> "GET".equals(request.getMethod())
                && (request.getContextPath() + "/ws").equals(request.getRequestURI())
                && "websocket".equalsIgnoreCase(request.getHeader("Upgrade"))
                && request.getHeader("Connection") != null
                && Arrays.stream(request.getHeader("Connection").split(","))
                        .anyMatch(value -> "upgrade".equalsIgnoreCase(value.trim()));
        return http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.requestMatchers(handshake).permitAll().anyRequest().authenticated())
                .exceptionHandling(errors -> errors.authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler((request, response, error) -> entryPoint.write(response, ErrorCode.UNAUTHORIZED)))
                .oauth2ResourceServer(oauth -> oauth.authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler((request, response, error) -> entryPoint.write(response, ErrorCode.UNAUTHORIZED))
                        .jwt(jwt -> jwt.decoder(decoder).jwtAuthenticationConverter(converter)))
                .build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        var authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("scope");
        authorities.setAuthorityPrefix("");
        var converter = new JwtAuthenticationConverter();
        converter.setPrincipalClaimName("userId");
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}
