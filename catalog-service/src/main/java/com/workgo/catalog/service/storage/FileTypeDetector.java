package com.workgo.catalog.service.storage;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

//nhan dien loai file bang cac byte dau, khong tin duoi ten file hay Content-Type client gui
@Component
public class FileTypeDetector {

    public String detect(byte[] content) {

        if (startsWith(content, 0, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) return "image/jpeg";
        if (startsWith(content, 0, new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) return "image/png";
        if (startsWith(content, 0, ascii("RIFF")) && startsWith(content, 8, ascii("WEBP"))) return "image/webp";
        if (startsWith(content, 0, ascii("%PDF-"))) return "application/pdf";
        if (startsWith(content, 0, new byte[]{'P', 'K', 0x03, 0x04})) return "application/zip";
        if (startsWith(content, 4, ascii("ftyp"))) return "video/mp4";

        return null;
    }

    //=====================================

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
