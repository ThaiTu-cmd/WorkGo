package com.workgo.job.configuration;

/** Resource authentication must fail closed without reporting a revoked user session. */
public class IdentityUnavailableException extends org.springframework.security.oauth2.jwt.BadJwtException {
    public IdentityUnavailableException() { super("Identity verification unavailable"); }
    public IdentityUnavailableException(Throwable cause) { super("Identity verification unavailable", cause); }
    public static boolean causedBy(Throwable error) {
        for (Throwable current=error; current!=null; current=current.getCause()) {
            if (current instanceof IdentityUnavailableException) return true;
        }
        return false;
    }
}
