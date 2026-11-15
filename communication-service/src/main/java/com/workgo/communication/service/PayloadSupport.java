package com.workgo.communication.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workgo.communication.dto.request.*;
import com.workgo.communication.enumeration.MessageType;
import com.workgo.communication.exception.*;
import jakarta.annotation.PreDestroy;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;
import java.util.List;

/** Canonical serialization is independent of JSON property order supplied by callers. */
@Component
public class PayloadSupport {
    private final ObjectMapper json = new ObjectMapper();
    private final ValidatorFactory validation = Validation.buildDefaultValidatorFactory();

    @PreDestroy public void close() { validation.close(); }

    public void validate(Object request) {
        if (request == null || !validation.getValidator().validate(request).isEmpty())
            throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    public String serialize(Object value) {
        try { return json.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Cannot serialize canonical payload", e); }
    }

    public String hash(Object value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(serialize(value).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    public void validateMessage(MessageSendReq request, int maxCount, long maxFile, long maxTotal) {
        if (request == null) throw new AppException(ErrorCode.INVALID_REQUEST);
        if (!List.of(MessageType.TEXT, MessageType.IMAGE, MessageType.FILE).contains(request.messageType()))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if ((request.content() == null || request.content().isBlank()) && request.attachments().isEmpty())
            throw new AppException(ErrorCode.EMPTY_MESSAGE);
        if (request.attachments().size() > Math.min(maxCount, 10)) invalidAttachment();
        long remaining = Math.min(maxTotal, 100L * 1024 * 1024);
        for (AttachmentReq file : request.attachments()) {
            if (file == null || file.sizeBytes() == null || file.sizeBytes() <= 0
                    || file.sizeBytes() > Math.min(maxFile, 20L * 1024 * 1024) || file.sizeBytes() > remaining)
                invalidAttachment();
            remaining -= file.sizeBytes();
            try {
                URI uri = URI.create(file.fileUrl());
                if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                        || uri.getHost() == null || uri.getRawUserInfo() != null || uri.getRawFragment() != null)
                    invalidAttachment();
            } catch (IllegalArgumentException | NullPointerException e) { invalidAttachment(); }
        }
        validate(request);
    }

    private void invalidAttachment() { throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA); }
}
