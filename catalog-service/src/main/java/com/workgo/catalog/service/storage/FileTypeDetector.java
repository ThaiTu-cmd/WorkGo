package com.workgo.catalog.service.storage;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

//nhan dien loai file bang cac byte dau, khong tin duoi ten file hay Content-Type client gui
@Component
public class FileTypeDetector {

    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "html", "htm", "js", "mjs", "cjs", "php", "phtml", "exe", "dll", "bat", "cmd", "sh", "ps1", "jsp", "jspx", "svg", "xhtml"
    );

    public String detect(byte[] content) {
        if (content == null || content.length == 0) return null;

        String detected = null;
        if (startsWith(content, 0, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) detected = "image/jpeg";
        else if (startsWith(content, 0, new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) detected = "image/png";
        else if (startsWith(content, 0, ascii("RIFF")) && startsWith(content, 8, ascii("WEBP"))) detected = "image/webp";
        else if (startsWith(content, 0, ascii("%PDF-"))) detected = "application/pdf";
        else if (startsWith(content, 0, new byte[]{'P', 'K', 0x03, 0x04})) detected = "application/zip";
        else if (startsWith(content, 4, ascii("ftyp"))) detected = "video/mp4";

        if (detected != null && isPolyglotPayload(content, detected)) {
            return null;
        }
        return detected;
    }

    public boolean isDeclaredMimeCompatible(String declaredContentType, String detectedMime) {
        if (detectedMime == null) return false;
        if (declaredContentType == null || declaredContentType.isBlank()) return true;
        String base = declaredContentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
        if (base.isEmpty() || "application/octet-stream".equals(base) || "multipart/form-data".equals(base)) return true;
        if ("image/jpg".equals(base)) base = "image/jpeg";
        return detectedMime.equalsIgnoreCase(base);
    }

    public boolean isSafeFilename(String originalName) {
        if (originalName == null || originalName.isBlank()) return true;
        if (originalName.indexOf('\0') >= 0) return false;
        String normalized = originalName.replace('\\', '/');
        if (normalized.contains("../") || normalized.contains("/..") || normalized.startsWith("/")) return false;
        String base = normalized.substring(normalized.lastIndexOf('/') + 1).trim();
        if (base.isEmpty() || ".".equals(base) || "..".equals(base)) return false;
        String[] parts = base.toLowerCase(Locale.ROOT).split("\\.");
        for (int i = 1; i < parts.length; i++) {
            if (DANGEROUS_EXTENSIONS.contains(parts[i])) {
                return false;
            }
        }
        return true;
    }

    private boolean isPolyglotPayload(byte[] content, String detectedMime) {
        int inspectLen = Math.min(content.length, 4096);
        String head = new String(content, 0, inspectLen, StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT);
        String tail = content.length > 4096
                ? new String(content, content.length - 4096, 4096, StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT)
                : "";
        String sample = head + "\n" + tail;
        if (sample.contains("<script") || sample.contains("<?php") || sample.contains("<html") || sample.contains("<!doctype html")) {
            return true;
        }
        if (detectedMime.startsWith("image/")) {
            return sample.contains("javascript:") || sample.contains("onerror=") || sample.contains("onload=");
        }
        return false;
    }

    private boolean startsWith(byte[] content, int offset, byte[] prefix) {
        if (content.length < offset + prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (content[offset + i] != prefix[i]) return false;
        }
        return true;
    }

    private byte[] ascii(String value) {
        return value.getBytes(StandardCharsets.US_ASCII);
    }
}
