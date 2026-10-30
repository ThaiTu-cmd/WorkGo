package com.workgo.gateway.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.gateway.dto.ApiResponse;
import com.workgo.gateway.service.IdentityService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Configuration
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {

    IdentityService identityService;
    ObjectMapper objectMapper;

    private final String[] PUBLIC_ENDPOINTS = {
            "/identity/users/registration",
            "/identity/auth/token",
            "/identity/auth/introspect",
            "/identity/auth/logout",
            "/identity/auth/refresh"
    };

    // Read-only catalog data guests can browse without logging in.
    private final String[] PUBLIC_GET_ENDPOINTS = {
            "/catalog/categories", "/catalog/categories/**",
            "/catalog/services", "/catalog/services/*",
            "/catalog/packages/**",
            "/catalog/addons/**",
            "/catalog/medias/**",
            "/catalog/rules/**",
            "/catalog/slots/**"
    };

    // Matches PUBLIC_GET_ENDPOINTS but still needs the caller's identity.
    private final String[] PROTECTED_GET_ENDPOINTS = {
            "/catalog/services/my-services"
    };

    AntPathMatcher pathMatcher = new AntPathMatcher();

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if(isPublicEndpoint(exchange.getRequest())){
            return chain.filter(exchange);
        }

        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if(CollectionUtils.isEmpty(authHeader)){
            return unauthenticated(exchange.getResponse());
        }

        String token = authHeader.getFirst().replace("Bearer ", "");
        log.info("Token: {}", token);

        // Only a failed/invalid introspection means "unauthenticated". Errors from the
        // downstream service (e.g. it is down) must not become 401, or clients drop
        // a perfectly valid token and log the user out.
        return identityService.introspect(token)
                .map(introspectResponse -> introspectResponse.getResult().isValid())
                .onErrorReturn(false)
                .flatMap(valid -> valid
                        ? chain.filter(exchange)
                        : unauthenticated(exchange.getResponse()));

    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean isPublicEndpoint(ServerHttpRequest request){
        String path = request.getURI().getPath();

        if (Arrays.stream(PUBLIC_ENDPOINTS)
                .anyMatch(publicEndpoint -> path.equals(apiPrefix + publicEndpoint))) {
            return true;
        }

        return HttpMethod.GET.equals(request.getMethod())
                && Arrays.stream(PROTECTED_GET_ENDPOINTS)
                        .noneMatch(endpoint -> path.equals(apiPrefix + endpoint))
                && Arrays.stream(PUBLIC_GET_ENDPOINTS)
                        .anyMatch(pattern -> pathMatcher.match(apiPrefix + pattern, path));
    }

    Mono<Void> unauthenticated(ServerHttpResponse response){
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(1401)
                .message("Unauthenticated")
                .build();

        String body = null;

        try{
            body = objectMapper.writeValueAsString(apiResponse);
        }catch (JsonProcessingException e){
            throw new RuntimeException(e);
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        return response.writeWith(
                Mono.just(response.bufferFactory().wrap(body.getBytes()))
        );

    }
}
