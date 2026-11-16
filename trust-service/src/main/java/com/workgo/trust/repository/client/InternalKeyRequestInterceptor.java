package com.workgo.trust.repository.client;

import feign.RequestInterceptor;
import feign.RequestTemplate;

public final class InternalKeyRequestInterceptor implements RequestInterceptor {
    private final String internalKey;

    public InternalKeyRequestInterceptor(String internalKey) { this.internalKey = internalKey; }

    @Override public void apply(RequestTemplate template) {
        if (internalKey == null || internalKey.isBlank()) {
            throw new IllegalStateException("Internal service key is not configured");
        }
        template.removeHeader("X-Internal-Key");
        template.header("X-Internal-Key", internalKey);
    }
}
