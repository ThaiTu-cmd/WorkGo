package com.workgo.catalog.repository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${WORKGO_TEST_DB_URL}",
        "spring.datasource.username=${WORKGO_TEST_DB_USER}",
        "spring.datasource.password=${WORKGO_TEST_DB_PASSWORD}",
        "spring.sql.init.mode=never"
})
@EnabledIfEnvironmentVariable(named = "WORKGO_TEST_DB_URL", matches = "jdbc:postgresql:.*")
class CatalogSeedTest {

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;

    @Test
    void seedStartsOnCurrentSchemaAndCanRunAgainWithoutChangingExistingRows() {
        var seed = new ResourceDatabasePopulator(new ClassPathResource("data.sql"));
        seed.execute(dataSource);
        assertEquals(20L, jdbc.queryForObject("SELECT count(*) FROM services", Long.class));
        assertEquals(0L, jdbc.queryForObject("SELECT max(rating_aggregate_version) FROM services", Long.class));
        Map<String, Long> counts = counts();

        jdbc.update("UPDATE services SET rating_aggregate_version = 7, avg_rating = 4.2, review_count = 3 "
                + "WHERE service_id = '44444444-4444-4444-4444-444444444444'");
        seed.execute(dataSource);

        assertEquals(counts, counts());
        assertEquals(7L, jdbc.queryForObject("SELECT rating_aggregate_version FROM services "
                + "WHERE service_id = '44444444-4444-4444-4444-444444444444'", Long.class));
        assertEquals(4.2, jdbc.queryForObject("SELECT avg_rating FROM services "
                + "WHERE service_id = '44444444-4444-4444-4444-444444444444'", Double.class));
        assertEquals(3L, jdbc.queryForObject("SELECT review_count FROM services "
                + "WHERE service_id = '44444444-4444-4444-4444-444444444444'", Long.class));
    }

    private Map<String, Long> counts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String table : new String[]{"categories", "services", "packages", "add_ons", "service_medias", "available_rules"}) {
            counts.put(table, jdbc.queryForObject("SELECT count(*) FROM " + table, Long.class));
        }
        return counts;
    }
}
