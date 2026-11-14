package com.workgo.communication.dto.request;

public record IntrospectRequest(String token) {
    @Override public String toString() { return "IntrospectRequest[token=REDACTED]"; }
}
