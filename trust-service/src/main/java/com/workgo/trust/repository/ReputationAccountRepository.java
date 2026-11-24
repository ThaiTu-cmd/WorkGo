package com.workgo.trust.repository;
import com.workgo.trust.entity.ReputationAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ReputationAccountRepository extends JpaRepository<ReputationAccount,UUID>{}
