package com.workgo.catalog.service.storage;

public interface FileStorage {

    void put(String key, byte[] content);

    byte[] get(String key);
}
