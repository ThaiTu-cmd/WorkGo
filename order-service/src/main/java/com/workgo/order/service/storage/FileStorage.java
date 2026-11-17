package com.workgo.order.service.storage;

public interface FileStorage {

    void put(String key, byte[] content);

    byte[] get(String key);
}
