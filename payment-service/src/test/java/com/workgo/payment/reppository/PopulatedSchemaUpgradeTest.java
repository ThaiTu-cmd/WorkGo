package com.workgo.payment.reppository;

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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.springframework.jdbc.datasource.init.ScriptStatementFailedException;

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
    void hibernateUpgradeKeepsLegacyEscrowAmountsAndStatusAndBackfillsGatewayFunding() throws SQLException {
        jdbc.execute("DELETE FROM escrow_accounts");
        jdbc.execute("DELETE FROM payments");
        jdbc.execute("ALTER TABLE escrow_accounts DROP COLUMN funding_source");
        jdbc.update("INSERT INTO payments (payment_id, payment_code, amount, gateway, idempotency_key, status, order_id, payer_id) "
                + "VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'upgrade-fixture', 100000, 'MOCK', 'upgrade-fixture', 'SUCCEEDED', "
                + "'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc')");
        jdbc.update("INSERT INTO escrow_accounts (escrow_account_id, order_id, client_id, provider_id, held_amount, "
                + "released_amount, refunded_amount, status, currency, payment_id) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', "
                + "'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', "
                + "'dddddddd-dddd-dddd-dddd-dddddddddddd', 100000, 30000, 20000, 'PARTIALLY_REFUNDED', 'VND', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')");
        upgrade();
        assertEquals("GATEWAY", jdbc.queryForObject("SELECT funding_source FROM escrow_accounts", String.class));
        assertEquals(100000L, jdbc.queryForObject("SELECT held_amount FROM escrow_accounts", Long.class));
        assertEquals(30000L, jdbc.queryForObject("SELECT released_amount FROM escrow_accounts", Long.class));
        assertEquals(20000L, jdbc.queryForObject("SELECT refunded_amount FROM escrow_accounts", Long.class));
        assertEquals("PARTIALLY_REFUNDED", jdbc.queryForObject("SELECT status FROM escrow_accounts", String.class));
        jdbc.execute("ALTER TABLE escrow_accounts DROP COLUMN funding_source");
        migrateSql();
        assertEquals("GATEWAY", jdbc.queryForObject("SELECT funding_source FROM escrow_accounts", String.class));
        jdbc.update("UPDATE escrow_accounts SET funding_source = 'WALLET'");
        upgrade();
        migrateSql();
        migrateSql();
        assertEquals("WALLET", jdbc.queryForObject("SELECT funding_source FROM escrow_accounts", String.class));
        jdbc.execute("ALTER TABLE escrow_accounts ALTER COLUMN funding_source DROP NOT NULL");
        jdbc.update("UPDATE escrow_accounts SET funding_source = NULL");
        migrateSql();
        assertEquals("GATEWAY", jdbc.queryForObject("SELECT funding_source FROM escrow_accounts", String.class));
        jdbc.execute("ALTER TABLE escrow_accounts ALTER COLUMN funding_source DROP NOT NULL");
        jdbc.update("UPDATE escrow_accounts SET funding_source = NULL, payment_id = NULL");
        assertThrows(ScriptStatementFailedException.class, this::migrateSql);
        assertNull(jdbc.queryForObject("SELECT funding_source FROM escrow_accounts", String.class));
        jdbc.update("UPDATE escrow_accounts SET payment_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', "
                + "hold_transaction_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'");
        assertThrows(ScriptStatementFailedException.class, this::migrateSql);
        assertNull(jdbc.queryForObject("SELECT funding_source FROM escrow_accounts", String.class));
        assertEquals(100000L, jdbc.queryForObject("SELECT held_amount FROM escrow_accounts", Long.class));
        assertEquals("PARTIALLY_REFUNDED", jdbc.queryForObject("SELECT status FROM escrow_accounts", String.class));
    }

    private void migrateSql() throws SQLException {
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                new ResourceDatabasePopulator(new ClassPathResource("db/manual/20261119_escrow_funding_default.sql")).populate(connection);
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
