package com.workgo.job.service.storage;

public interface FileStorage {

    void put(String key, byte[] content);

    byte[] get(String key);

    default boolean exists(String key) {
        try {
            byte[] content = get(key);
            return content != null && content.length > 0;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    default void delete(String key) {
    }
}
