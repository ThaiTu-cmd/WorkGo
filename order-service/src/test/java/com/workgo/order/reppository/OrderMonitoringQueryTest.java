package com.workgo.order.reppository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest(showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${WORKGO_TEST_DB_URL}",
        "spring.datasource.username=${WORKGO_TEST_DB_USER}",
        "spring.datasource.password=${WORKGO_TEST_DB_PASSWORD}",
        "spring.jpa.show-sql=false"
})
@EnabledIfEnvironmentVariable(named = "WORKGO_TEST_DB_URL", matches = "jdbc:postgresql:.*")
class OrderMonitoringQueryTest {

    @Autowired
    OrderRepository orders;

    @Test
    void nullableMonitoringDatesAreBoundWithPostgresTypes() {
        var page = PageRequest.of(0, 10);
        assertNotNull(orders.searchForMonitoring(null, null, null, null, null, null, page));
        assertNotNull(orders.searchForMonitoring(null, null, null, null, Instant.EPOCH, null, page));
        assertNotNull(orders.searchForMonitoring(null, null, null, null, null, Instant.now(), page));
    }
}
