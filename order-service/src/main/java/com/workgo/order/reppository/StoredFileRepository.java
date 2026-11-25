package com.workgo.order.reppository;

import com.workgo.order.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    long countByOrderIdAndContextAndUploadedBy(UUID orderId, String context, UUID uploadedBy);

    Optional<StoredFile> findFirstByOrderIdAndContextAndUploadedByAndSha256OrderByCreatedAtAsc(
            UUID orderId, String context, UUID uploadedBy, String sha256);
}
