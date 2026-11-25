package com.workgo.catalog.configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Bounded correlation metadata only. Authentication and authorization never read this value. */
@Component
public class CorrelationTrace extends OncePerRequestFilter implements RequestInterceptor, Ordered {
    public static final String HEADER="X-Correlation-Id";
    private static final String KEY="correlationId";
    public static String normalize(String value) {
        return value!=null && value.matches("[A-Za-z0-9-]{1,64}") ? value : UUID.randomUUID().toString();
    }
    public static String current() { return normalize(MDC.get(KEY)); }
    public static Scope use(String value) {
        String previous=MDC.get(KEY);
        MDC.put(KEY,normalize(value));
        return ()->{if(previous==null)MDC.remove(KEY);else MDC.put(KEY,previous);};
    }
    public interface Scope extends AutoCloseable { @Override void close(); }
    @Override public int getOrder(){return Ordered.HIGHEST_PRECEDENCE+10;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)
            throws ServletException,IOException {
        var values=Collections.list(request.getHeaders(HEADER));
        String trace=normalize(values.size()==1?values.getFirst():null);
        try(var ignored=use(trace)) {
            response.setHeader(HEADER,trace);
            var wrapped=new HttpServletRequestWrapper(request) {
                @Override public String getHeader(String name){return HEADER.equalsIgnoreCase(name)?trace:super.getHeader(name);}
                @Override public Enumeration<String> getHeaders(String name){return HEADER.equalsIgnoreCase(name)?Collections.enumeration(List.of(trace)):super.getHeaders(name);}
                @Override public Enumeration<String> getHeaderNames(){var names=Collections.list(super.getHeaderNames());if(names.stream().noneMatch(HEADER::equalsIgnoreCase))names.add(HEADER);return Collections.enumeration(names);}
            };
            chain.doFilter(wrapped,response);
        }
    }
    @Override public void apply(RequestTemplate template) {
        template.removeHeader(HEADER);
        template.header(HEADER,current());
    }
}
