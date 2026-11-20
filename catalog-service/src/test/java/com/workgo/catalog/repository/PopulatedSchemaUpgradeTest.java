package com.workgo.catalog.repository;

import jakarta.persistence.EntityManagerFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.tool.schema.spi.SchemaManagementToolCoordinator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import java.sql.SQLException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${WORKGO_MIGRATION_TEST_DB_URL}",
        "spring.datasource.username=${WORKGO_TEST_DB_USER}",
        "spring.datasource.password=${WORKGO_TEST_DB_PASSWORD}",
        "spring.jpa.hibernate.ddl-auto=update", "spring.sql.init.mode=never"
})
// This test removes columns: require a dedicated scratch database, never an application database.
@EnabledIfEnvironmentVariable(named = "WORKGO_MIGRATION_TEST_DB_URL", matches = "jdbc:postgresql:.*?/upgrade_[a-f0-9]+")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class PopulatedSchemaUpgradeTest {
    @Autowired DataSource dataSource;
    @Autowired EntityManagerFactory entities;
    @Autowired JdbcTemplate jdbc;

    @Test
    void hibernateUpgradeBackfillsNewColumnWithoutChangingExistingRatings() throws SQLException {
        jdbc.execute("DELETE FROM services");
        jdbc.execute("ALTER TABLE services DROP COLUMN rating_aggregate_version");
        jdbc.update("INSERT INTO services (service_id, provider_id, title, slug, execution_type, base_price, currency, status, "
                + "avg_rating, review_count, is_deleted) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', "
                + "'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Upgrade fixture', 'upgrade-fixture', 'DIGITAL', 100000, 'VND', 'PUBLISHED', 4.2, 3, 0)");

        upgrade();
        assertEquals(0L, jdbc.queryForObject("SELECT rating_aggregate_version FROM services", Long.class));
        assertEquals(4.2, jdbc.queryForObject("SELECT avg_rating FROM services", Double.class));
        assertEquals(3L, jdbc.queryForObject("SELECT review_count FROM services", Long.class));
        jdbc.execute("ALTER TABLE services DROP COLUMN rating_aggregate_version");
        migrateSql();
        assertEquals(0L, jdbc.queryForObject("SELECT rating_aggregate_version FROM services", Long.class));
        jdbc.update("UPDATE services SET rating_aggregate_version = 9");
        upgrade();
        migrateSql();
        migrateSql();
        assertEquals(9L, jdbc.queryForObject("SELECT rating_aggregate_version FROM services", Long.class));
        jdbc.execute("ALTER TABLE services ALTER COLUMN rating_aggregate_version DROP NOT NULL");
        jdbc.update("UPDATE services SET rating_aggregate_version = NULL");
        migrateSql();
        assertEquals(0L, jdbc.queryForObject("SELECT rating_aggregate_version FROM services", Long.class));
        assertEquals(4.2, jdbc.queryForObject("SELECT avg_rating FROM services", Double.class));
        assertEquals(3L, jdbc.queryForObject("SELECT review_count FROM services", Long.class));
    }

    private void migrateSql() throws SQLException {
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                new ResourceDatabasePopulator(new ClassPathResource("db/manual/20261119_service_snapshot_default.sql")).populate(connection);
            } catch (RuntimeException failure) {
                connection.rollback();
                throw failure;
            }
        }
    }

    private void upgrade() {
        var registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.connection.datasource", dataSource)
                .applySetting("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")
                .applySetting("hibernate.hbm2ddl.halt_on_error", true).build();
        try {
            var sources = new MetadataSources(registry);
            entities.getMetamodel().getEntities().forEach(entity -> sources.addAnnotatedClass(entity.getJavaType()));
            SchemaManagementToolCoordinator.process(sources.buildMetadata(), registry,
                    Map.of("hibernate.hbm2ddl.auto", "update", "hibernate.hbm2ddl.halt_on_error", true), null);
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}
