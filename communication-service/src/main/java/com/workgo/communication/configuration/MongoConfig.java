package com.workgo.communication.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.util.List;
import java.util.UUID;

@Configuration
@EnableTransactionManagement
public class MongoConfig {
    @Bean MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(UUIDToStringConverter.INSTANCE, StringToUUIDConverter.INSTANCE));
    }

    @Bean MongoTransactionManager mongoTransactionManager(MongoDatabaseFactory factory) {
        return new MongoTransactionManager(factory);
    }

    @WritingConverter
    public enum UUIDToStringConverter implements Converter<UUID, String> {
        INSTANCE;
        @Override public String convert(UUID source) { return source.toString(); }
    }

    @ReadingConverter
    public enum StringToUUIDConverter implements Converter<String, UUID> {
        INSTANCE;
        @Override public UUID convert(String source) { return UUID.fromString(source); }
    }
}
