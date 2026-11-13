package com.workgo.communication.configuration;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Data
@Validated
@ConfigurationProperties("app.websocket")
public class WebSocketProperties {
    @NotEmpty private List<String> allowedOrigins = List.of("http://localhost:5173");
    @Min(1) private int maxPendingHandshakes = 100;
    @Min(1) private int maxSessions = 1000;
    @Min(1) private int maxSubscriptions = 100;
    @Min(1) private int messageSizeLimit = 65536;
    @Min(1) private int connectTimeoutMs = 10000;
    @Min(1) private int heartbeatMs = 10000;
    @Min(1) private int revalidateIntervalMs = 60000;
    @Min(1) private int maintenanceIntervalMs = 1000;
    @Min(1) private int validationTimeoutMs = 8000;
    @Min(1) private int validationThreads = 4;
    @Min(0) private int validationQueueCapacity = 100;

    @AssertTrue(message = "WebSocket origins must be explicit HTTP(S) origins without wildcard")
    public boolean isOriginAllowlistExplicit() {
        return allowedOrigins != null && allowedOrigins.stream().allMatch(value -> {
            try {
                var uri = java.net.URI.create(value);
                return ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                        && uri.getHost() != null && !value.contains("*") && uri.getUserInfo() == null
                        && (uri.getPath() == null || uri.getPath().isEmpty())
                        && uri.getQuery() == null && uri.getFragment() == null;
            } catch (IllegalArgumentException exception) { return false; }
        });
    }
}
