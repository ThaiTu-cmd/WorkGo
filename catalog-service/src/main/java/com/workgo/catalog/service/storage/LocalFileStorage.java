package com.workgo.catalog.service.storage;

import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

//chi dung cho dev/QA, moi truong that thay bang S3 adapter (D10)
@Component
@Primary
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class LocalFileStorage implements FileStorage {

    Path root;

    public LocalFileStorage(@Value("${app.storage.local-dir:./.workgo-storage/catalog}") String localDir) {
        this.root = Path.of(localDir).toAbsolutePath().normalize();
    }

    @Override
    public void put(String key, byte[] content) {
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    @Override
    public byte[] get(String key) {
        Path target = resolve(key);
        try {
            if (!Files.isRegularFile(target)) {
                throw new AppException(ErrorCode.MEDIA_NOT_EXISTED);
            }
            return Files.readAllBytes(target);
        } catch (IOException e) {
            throw new AppException(ErrorCode.MEDIA_NOT_EXISTED);
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
            throw new AppException(ErrorCode.MEDIA_NOT_EXISTED);
        }
        String clean = key.replace('\\', '/').replaceAll("^/+", "");
        if (clean.isBlank() || clean.contains("..")) {
            throw new AppException(ErrorCode.MEDIA_NOT_EXISTED);
        }
        Path target = root.resolve(clean).normalize();
        if (!target.startsWith(root) || target.equals(root)) {
            throw new AppException(ErrorCode.MEDIA_NOT_EXISTED);
        }
        return target;
    }
}
