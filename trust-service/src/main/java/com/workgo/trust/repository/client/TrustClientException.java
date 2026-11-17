package com.workgo.trust.repository.client;

/** Dependency authentication errors must not be interpreted as an end-user 401. */
public final class TrustClientException extends RuntimeException {
    private final int httpStatus;
    private final Integer remoteCode;
    public TrustClientException(int httpStatus, Integer remoteCode) {
        super("Internal dependency returned HTTP " + httpStatus + (remoteCode == null ? "" : " (code " + remoteCode + ")"));
        this.httpStatus = httpStatus;
        this.remoteCode = remoteCode;
    }
    public int getHttpStatus() { return httpStatus; }
    public Integer getRemoteCode() { return remoteCode; }
    public boolean isRetryable() { return httpStatus >= 500 || httpStatus == 429; }
}
