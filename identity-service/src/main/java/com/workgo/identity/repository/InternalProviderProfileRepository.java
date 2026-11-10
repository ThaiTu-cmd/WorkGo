package com.workgo.identity.repository;

import com.workgo.identity.dto.response.InternalProviderProfileResponse;
import com.workgo.identity.enumeration.ProviderType;
import com.workgo.identity.enumeration.VerificationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/** Internal reads intentionally include disabled accounts, bypassing User's ACTIVE ORM restriction. */
@Repository
@RequiredArgsConstructor
public class InternalProviderProfileRepository {
    private final JdbcTemplate jdbcTemplate;

    public Optional<InternalProviderProfileResponse> findById(UUID providerId) {
        return jdbcTemplate.query("""
                SELECT p.provider_profile_id, p.provider_type, p.business_name, p.bio,
                       p.verification_status, p.rating_avg, p.rating_count, p.completed_order_count,
                       p.is_accepting_orders, p.joined_at, u.user_id, u.status AS user_status
                  FROM provider_profiles p
                  JOIN users u ON u.user_id = p.user_id
                 WHERE p.provider_profile_id = ? AND p.is_deleted = 0
                """, (rs, rowNum) -> new InternalProviderProfileResponse(
                rs.getObject("provider_profile_id", UUID.class),
                rs.getString("provider_type") == null ? null : ProviderType.valueOf(rs.getString("provider_type")),
                rs.getString("business_name"), rs.getString("bio"),
                rs.getString("verification_status") == null ? null : VerificationStatus.valueOf(rs.getString("verification_status")),
                rs.getDouble("rating_avg"), rs.getLong("rating_count"), rs.getInt("completed_order_count"),
                rs.getBoolean("is_accepting_orders"),
                rs.getTimestamp("joined_at") == null ? null : rs.getTimestamp("joined_at").toInstant(),
                rs.getObject("user_id", UUID.class), rs.getString("user_status")), providerId)
                .stream().findFirst();
    }
}
