package com.workgo.identity.service.storage;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

//chi dung cho dev/QA, moi truong that thay bang S3 adapter (D10)
@Component
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class LocalFileStorage implements FileStorage {

    Path root;

    public LocalFileStorage(@Value("${app.storage.local-dir}") String localDir) {
        this.root = Path.of(localDir).toAbsolutePath().normalize();
    }

    @Override
    public void put(String key, byte[] content) {

        Path target = resolve(key);

        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    @Override
    public byte[] get(String key) {

        try {
            return Files.readAllBytes(resolve(key));
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }
    }

    //=====================================

    private Path resolve(String key) {

        Path target = root.resolve(key).normalize();

        if (!target.startsWith(root)) throw new AppException(ErrorCode.FILE_NOT_FOUND);

        return target;
    }
}
