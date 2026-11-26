package com.workgo.trust.repository;
import com.workgo.trust.entity.RewardQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface RewardQuoteRepository extends JpaRepository<RewardQuote,UUID> {}
