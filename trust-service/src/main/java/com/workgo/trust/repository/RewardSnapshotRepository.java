package com.workgo.trust.repository;
import com.workgo.trust.entity.RewardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface RewardSnapshotRepository extends JpaRepository<RewardSnapshot,UUID>{}
