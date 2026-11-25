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
import org.springframework.util.StringUtils;
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

    //vnpay / momo goi IPN + redirect trinh duyet ve, khong co token (payment-service tu check chu ky)
    //dev: link mock /dev/payments/{code}/success mo bang trinh duyet
    private final String[] PUBLIC_PREFIXES = {
            "/payment/gateway/",
            "/payment/dev/"
    };

    // Read-only listings and reviews guests can browse without logging in.
    private final String[] PUBLIC_GET_ENDPOINTS = {
            "/catalog/categories", "/catalog/categories/**",
            "/catalog/services", "/catalog/services/*",
            "/catalog/packages/**",
            "/catalog/addons/**",
            "/catalog/medias/**",
            "/catalog/rules/**",
            "/catalog/slots/**",
            "/job/jobs", "/job/jobs/*",
            "/trust/providers/*/reviews",
            "/trust/services/*/reviews"
    };

    // Matches PUBLIC_GET_ENDPOINTS but still needs the caller's identity.
    private final String[] PROTECTED_GET_ENDPOINTS = {
            "/catalog/services/my-services",
            "/job/jobs/my-jobs"
    };

    AntPathMatcher pathMatcher = new AntPathMatcher();

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (isInternalEndpoint(exchange.getRequest())) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        if (isCommunicationWebSocketHandshake(exchange.getRequest())) {
            return chain.filter(exchange);
        }

        if(isPublicEndpoint(exchange.getRequest())){
            return chain.filter(exchange);
        }

        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if(CollectionUtils.isEmpty(authHeader)){
            return unauthenticated(exchange.getResponse());
        }

        String authorization = authHeader.getFirst();
        if (!authorization.startsWith("Bearer ") || authorization.substring(7).isBlank()) {
            return unauthenticated(exchange.getResponse());
        }
        String token = authorization.substring(7);

        // Only a failed/invalid introspection means "unauthenticated". Errors from the
        // downstream service (e.g. it is down) must not become 401, or clients drop
        // a perfectly valid token and log the user out.
        return identityService.introspect(token)
                .timeout(java.time.Duration.ofSeconds(7))
                .map(response -> response.getCode() == 1000 ? java.util.Optional.ofNullable(response.getResult()) : java.util.Optional.<com.workgo.gateway.dto.response.IntrospectResponse>empty())
                .onErrorReturn(java.util.Optional.empty())
                .defaultIfEmpty(java.util.Optional.empty())
                .flatMap(result -> {
                    if (result.isEmpty()) {
                        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
                        return exchange.getResponse().setComplete();
                    }
                    if (!result.get().isValid()) return unauthenticated(exchange.getResponse());
                    if (!allowed(exchange.getRequest(), result.get().getScope())) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }
                    return chain.filter(exchange);
                });

    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean allowed(ServerHttpRequest request, String scope) {
        String path = StringUtils.cleanPath(request.getURI().getPath().replaceAll(";[^/]*", "").replaceAll("/{2,}", "/"));
        String relative = path.startsWith(apiPrefix) ? path.substring(apiPrefix.length()) : path;
        var roles = scope == null ? java.util.Set.<String>of() : new java.util.HashSet<>(Arrays.asList(scope.trim().split("\\s+")));
        boolean read = HttpMethod.GET.equals(request.getMethod());
        if (relative.matches("/(identity|catalog|payment|job|trust|communication)/admin/audit-logs(?:/.*)?")) {
            if (!read) return false;
            if (relative.endsWith("/export")) return roles.contains("ROLE_SUPER_ADMIN");
            return roles.contains("ROLE_SUPER_ADMIN") || roles.contains("ROLE_ADMIN");
        }
        if (relative.matches("/order/admin/input-support(?:/.*)?")) return read && roles.contains("ROLE_ADMIN");
        if (relative.matches("/(identity|catalog|payment|order)/admin(?:/.*)?")) return roles.contains("ROLE_SUPER_ADMIN");
        if (relative.matches("/(job|trust|communication)/admin/audit-logs(?:/.*)?")) return read && roles.contains("ROLE_SUPER_ADMIN");
        if (relative.matches("/job/admin(?:/.*)?")) return roles.contains("ROLE_ADMIN") || read && roles.contains("ROLE_SUPER_ADMIN");
        if (relative.matches("/(trust|communication)/admin(?:/.*)?")) return roles.contains("ROLE_ADMIN");
        if (relative.matches("/identity/users(?:/.*)?") && !relative.equals("/identity/users/myInfo")
                || relative.equals("/identity/provider-verifications") && read
                || relative.matches("/identity/provider-verifications/[^/]+/review")
                || relative.matches("/identity/providers/[^/]+/verification")
                || relative.matches("/catalog/categories(?:/.*)?") && !read) return roles.contains("ROLE_SUPER_ADMIN");
        return true;
    }

    private boolean isInternalEndpoint(ServerHttpRequest request) {
        String path = StringUtils.cleanPath(request.getURI().getPath()
                .replaceAll(";[^/]*", "").replaceAll("/{2,}", "/"));
        return Arrays.stream(new String[]{"/communication/internal", "/trust/internal", "/order/internal",
                        "/payment/internal", "/identity/internal", "/catalog/internal", "/job/internal"})
                .map(endpoint -> apiPrefix + endpoint)
                .anyMatch(internalPath -> path.equals(internalPath) || path.startsWith(internalPath + "/"));
    }

    private boolean isCommunicationWebSocketHandshake(ServerHttpRequest request) {
        return HttpMethod.GET.equals(request.getMethod())
                && (apiPrefix + "/communication/ws").equals(request.getURI().getRawPath())
                && "websocket".equalsIgnoreCase(request.getHeaders().getUpgrade())
                && request.getHeaders().getConnection().stream()
                        .anyMatch(value -> "upgrade".equalsIgnoreCase(value));
    }

    private boolean isPublicEndpoint(ServerHttpRequest request){
        String path = request.getURI().getPath();
        String protectedPath = path.replaceAll(";[^/]*", "");

        if (Arrays.stream(PUBLIC_ENDPOINTS)
                .anyMatch(publicEndpoint -> path.equals(apiPrefix + publicEndpoint))) {
            return true;
        }

        //vnpay / momo callback + dev mock: moi method, khong can token
        if (!path.contains("..") && Arrays.stream(PUBLIC_PREFIXES)
                .anyMatch(prefix -> path.startsWith(apiPrefix + prefix))) {
            return true;
        }


        return HttpMethod.GET.equals(request.getMethod())
                && Arrays.stream(PROTECTED_GET_ENDPOINTS)
                        .noneMatch(endpoint -> pathMatcher.match(apiPrefix + endpoint, protectedPath))
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
