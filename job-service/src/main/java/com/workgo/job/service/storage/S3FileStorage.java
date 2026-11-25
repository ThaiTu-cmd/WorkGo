package com.workgo.job.service.storage;

import com.workgo.job.exception.AppException;
import com.workgo.job.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Locale;

/** Private S3 storage adapter for Job attachments with AWS SigV4 signing (D10 / DEV-07). */
@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3FileStorage implements FileStorage {

    private static final DateTimeFormatter AMZ_DATE = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'", Locale.ROOT);
    private static final DateTimeFormatter DATE_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd", Locale.ROOT);
    private static final String EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    private final HttpClient httpClient;
    private final URI endpoint;
    private final String bucket;
    private final String region;
    private final String accessKey;
    private final String secretKey;
    private final String keyPrefix;
    private final Clock clock;

    public S3FileStorage(
            @Value("${app.storage.s3.endpoint:https://s3.amazonaws.com}") String endpoint,
            @Value("${app.storage.s3.bucket:}") String bucket,
            @Value("${app.storage.s3.region:ap-southeast-1}") String region,
            @Value("${app.storage.s3.access-key:}") String accessKey,
            @Value("${app.storage.s3.secret-key:}") String secretKey,
            @Value("${app.storage.s3.prefix:job}") String keyPrefix) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).followRedirects(HttpClient.Redirect.NEVER).build(),
                endpoint, bucket, region, accessKey, secretKey, keyPrefix, Clock.systemUTC());
    }

    public S3FileStorage(HttpClient httpClient, String endpoint, String bucket, String region,
                         String accessKey, String secretKey, String keyPrefix, Clock clock) {
        this.httpClient = httpClient;
        this.endpoint = URI.create(endpoint.replaceAll("/+$", ""));
        this.bucket = bucket == null ? "" : bucket.trim();
        this.region = region == null || region.isBlank() ? "ap-southeast-1" : region.trim();
        this.accessKey = accessKey == null ? "" : accessKey.trim();
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.keyPrefix = keyPrefix == null ? "" : keyPrefix.trim().replaceAll("^/+|/+$", "");
        this.clock = clock == null ? Clock.systemUTC() : clock;
    }

    @Override
    public void put(String key, byte[] content) {
        requireConfigured();
        if (content == null || content.length == 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String objectPath = objectPath(key);
        String payloadSha = sha256Hex(content);
        HttpRequest request = signedRequest("PUT", objectPath, payloadSha, HttpRequest.BodyPublishers.ofByteArray(content));
        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
            }
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
    }

    @Override
    public byte[] get(String key) {
        requireConfigured();
        String objectPath = objectPath(key);
        HttpRequest request = signedRequest("GET", objectPath, EMPTY_SHA256, HttpRequest.BodyPublishers.noBody());
        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body() == null) {
                throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
    }

    @Override
    public boolean exists(String key) {
        requireConfigured();
        String objectPath = objectPath(key);
        HttpRequest request = signedRequest("HEAD", objectPath, EMPTY_SHA256, HttpRequest.BodyPublishers.noBody());
        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            return false;
        }
    }

    @Override
    public void delete(String key) {
        if (bucket.isBlank() || accessKey.isBlank() || secretKey.isBlank()) return;
        try {
            String objectPath = objectPath(key);
            HttpRequest request = signedRequest("DELETE", objectPath, EMPTY_SHA256, HttpRequest.BodyPublishers.noBody());
            httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) {
        }
    }

    private void requireConfigured() {
        if (bucket.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        }
    }

    private String objectPath(String key) {
        if (key == null || key.isBlank() || key.indexOf('\0') >= 0 || key.contains("..")) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String clean = key.replace('\\', '/').replaceAll("^/+|/+$", "");
        if (clean.isBlank() || clean.contains("..")) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String fullKey = keyPrefix.isEmpty() ? clean : keyPrefix + "/" + clean;
        StringBuilder path = new StringBuilder("/").append(encodeSegment(bucket));
        for (String segment : fullKey.split("/")) {
            if (segment.isBlank() || ".".equals(segment) || "..".equals(segment)) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            path.append("/").append(encodeSegment(segment));
        }
        return path.toString();
    }

    private HttpRequest signedRequest(String method, String canonicalUri, String payloadHash, HttpRequest.BodyPublisher body) {
        ZonedDateTime now = ZonedDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        String amzDate = AMZ_DATE.format(now);
        String dateStamp = DATE_STAMP.format(now);
        String hostHeader = endpoint.getPort() > 0 ? endpoint.getHost() + ":" + endpoint.getPort() : endpoint.getHost();

        String canonicalHeaders = "host:" + hostHeader + "\n"
                + "x-amz-content-sha256:" + payloadHash + "\n"
                + "x-amz-date:" + amzDate + "\n";
        String signedHeaders = "host;x-amz-content-sha256;x-amz-date";
        String canonicalRequest = method + "\n" + canonicalUri + "\n\n" + canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;

        String credentialScope = dateStamp + "/" + region + "/s3/aws4_request";
        String stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + credentialScope + "\n" + sha256Hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));
        byte[] signingKey = deriveSigningKey(secretKey, dateStamp, region, "s3");
        String signature = HexFormat.of().formatHex(hmacSha256(signingKey, stringToSign));
        String authorization = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + credentialScope
                + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

        return HttpRequest.newBuilder(URI.create(endpoint.toString() + canonicalUri))
                .timeout(Duration.ofSeconds(10))
                .method(method, body)
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", amzDate)
                .header("x-amz-acl", "private")
                .header("Authorization", authorization)
                .build();
    }

    private static String encodeSegment(String segment) {
        return URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20").replace("*", "%2A").replace("%7E", "~");
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] hmacSha256(byte[] key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] deriveSigningKey(String secret, String dateStamp, String regionName, String serviceName) {
        byte[] kSecret = ("AWS4" + secret).getBytes(StandardCharsets.UTF_8);
        byte[] kDate = hmacSha256(kSecret, dateStamp);
        byte[] kRegion = hmacSha256(kDate, regionName);
        byte[] kService = hmacSha256(kRegion, serviceName);
        return hmacSha256(kService, "aws4_request");
    }
}
