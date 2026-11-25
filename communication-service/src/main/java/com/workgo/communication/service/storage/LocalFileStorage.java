package com.workgo.communication.service.storage;

import com.workgo.communication.exception.AppException;
import com.workgo.communication.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Local private storage adapter for Communication attachments in dev/QA (D10 / DEV-07). */
@Component
@Primary
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {

    private final Path root;

    public LocalFileStorage(@Value("${app.storage.local-dir:./.workgo-storage/communication}") String localDir) {
        this.root = Path.of(localDir).toAbsolutePath().normalize();
    }

    @Override
    public void put(String key, byte[] content) {
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new DataAccessResourceFailureException("Cannot write attachment to storage", e);
        }
    }

    @Override
    public byte[] get(String key) {
        Path target = resolve(key);
        try {
            if (!Files.isRegularFile(target)) {
                throw new DataAccessResourceFailureException("Attachment object not found");
            }
            return Files.readAllBytes(target);
        } catch (IOException e) {
            throw new DataAccessResourceFailureException("Cannot read attachment from storage", e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            Path target = resolve(key);
            return Files.isRegularFile(target) && Files.size(target) > 0;
        } catch (IOException | RuntimeException e) {
            return false;
        }
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException | RuntimeException ignored) {
        }
    }

    private Path resolve(String key) {
        if (key == null || key.isBlank() || key.indexOf('\0') >= 0 || key.contains("..")) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        String clean = key.replace('\\', '/').replaceAll("^/+", "");
        if (clean.isBlank() || clean.contains("..")) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        Path target = root.resolve(clean).normalize();
        if (!target.startsWith(root) || target.equals(root)) {
            throw new AppException(ErrorCode.INVALID_ATTACHMENT_METADATA);
        }
        return target;
    }
}
