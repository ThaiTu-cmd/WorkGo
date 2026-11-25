package com.workgo.gateway.configuration;

import java.util.UUID;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {
    public static final String HEADER="X-Correlation-Id";
    public static final String CONTEXT_KEY="workgo.correlationId";
    @Override public int getOrder(){return Ordered.HIGHEST_PRECEDENCE+10;}
    @Override public Mono<Void> filter(ServerWebExchange exchange,GatewayFilterChain chain) {
        var values=exchange.getRequest().getHeaders().get(HEADER);
        String candidate=values!=null && values.size()==1?values.getFirst():null;
        String trace=candidate!=null && candidate.matches("[A-Za-z0-9-]{1,64}")?candidate:UUID.randomUUID().toString();
        var request=exchange.getRequest().mutate().headers(h->h.set(HEADER,trace)).build();
        exchange.getResponse().getHeaders().set(HEADER,trace);
        return chain.filter(exchange.mutate().request(request).build()).contextWrite(c->c.put(CONTEXT_KEY,trace));
    }
}
