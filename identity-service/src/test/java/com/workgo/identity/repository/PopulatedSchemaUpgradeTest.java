package com.workgo.identity.repository;

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
    void hibernateUpgradeBackfillsRestrictionAndVersionWithoutChangingExistingProfile() throws SQLException {
        jdbc.execute("DELETE FROM provider_profiles");
        jdbc.execute("ALTER TABLE provider_profiles DROP COLUMN rating_aggregate_version, DROP COLUMN is_financially_restricted, DROP COLUMN financial_restriction_version");
        jdbc.update("INSERT INTO provider_profiles (provider_profile_id, rating_avg, rating_count, verification_status, is_deleted) "
                + "VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4.2, 3, 'VERIFIED', 0)");
        upgrade();
        assertEquals(0L, jdbc.queryForObject("SELECT rating_aggregate_version FROM provider_profiles", Long.class));
        assertEquals(false, jdbc.queryForObject("SELECT is_financially_restricted FROM provider_profiles", Boolean.class));
        assertEquals(0L, jdbc.queryForObject("SELECT financial_restriction_version FROM provider_profiles", Long.class));
        assertEquals(4.2, jdbc.queryForObject("SELECT rating_avg FROM provider_profiles", Double.class));
        assertEquals(3L, jdbc.queryForObject("SELECT rating_count FROM provider_profiles", Long.class));
        assertEquals("VERIFIED", jdbc.queryForObject("SELECT verification_status FROM provider_profiles", String.class));
        jdbc.execute("ALTER TABLE provider_profiles DROP COLUMN rating_aggregate_version, DROP COLUMN is_financially_restricted, DROP COLUMN financial_restriction_version");
        migrateSql();
        assertEquals(0L, jdbc.queryForObject("SELECT rating_aggregate_version FROM provider_profiles", Long.class));
        assertEquals(false, jdbc.queryForObject("SELECT is_financially_restricted FROM provider_profiles", Boolean.class));
        assertEquals(0L, jdbc.queryForObject("SELECT financial_restriction_version FROM provider_profiles", Long.class));
        jdbc.update("UPDATE provider_profiles SET rating_aggregate_version = 9, is_financially_restricted = true, financial_restriction_version = 5");
        upgrade();
        assertEquals(9L, jdbc.queryForObject("SELECT rating_aggregate_version FROM provider_profiles", Long.class));
        assertEquals(true, jdbc.queryForObject("SELECT is_financially_restricted FROM provider_profiles", Boolean.class));
        migrateSql();
        migrateSql();
        assertEquals(9L, jdbc.queryForObject("SELECT rating_aggregate_version FROM provider_profiles", Long.class));
        assertEquals(true, jdbc.queryForObject("SELECT is_financially_restricted FROM provider_profiles", Boolean.class));
        assertEquals(5L, jdbc.queryForObject("SELECT financial_restriction_version FROM provider_profiles", Long.class));
        jdbc.execute("ALTER TABLE provider_profiles ALTER COLUMN rating_aggregate_version DROP NOT NULL, "
                + "ALTER COLUMN is_financially_restricted DROP NOT NULL, ALTER COLUMN financial_restriction_version DROP NOT NULL");
        jdbc.update("UPDATE provider_profiles SET rating_aggregate_version = NULL, is_financially_restricted = NULL, financial_restriction_version = NULL");
        migrateSql();
        assertEquals(0L, jdbc.queryForObject("SELECT rating_aggregate_version FROM provider_profiles", Long.class));
        assertEquals(false, jdbc.queryForObject("SELECT is_financially_restricted FROM provider_profiles", Boolean.class));
        assertEquals(0L, jdbc.queryForObject("SELECT financial_restriction_version FROM provider_profiles", Long.class));
        assertEquals(4.2, jdbc.queryForObject("SELECT rating_avg FROM provider_profiles", Double.class));
        assertEquals(3L, jdbc.queryForObject("SELECT rating_count FROM provider_profiles", Long.class));
    }

    private void migrateSql() throws SQLException {
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                new ResourceDatabasePopulator(new ClassPathResource("db/manual/20261119_provider_snapshot_defaults.sql")).populate(connection);
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
