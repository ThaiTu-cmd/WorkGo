package com.workgo.identity.repository;
import com.workgo.identity.entity.SecuritySupportRequest;import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface SecuritySupportRequestRepository extends JpaRepository<SecuritySupportRequest,UUID>{List<SecuritySupportRequest> findTop100ByStatusOrderByCreatedAtAsc(String status);}
