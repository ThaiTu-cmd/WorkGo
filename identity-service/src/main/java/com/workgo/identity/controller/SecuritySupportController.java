package com.workgo.identity.controller;
import com.workgo.identity.entity.SecuritySupportRequest;import com.workgo.identity.repository.SecuritySupportRequestRepository;
import com.workgo.identity.dto.ApiResponse;import com.workgo.identity.Exception.*;import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;import org.springframework.security.access.prepost.PreAuthorize;import jakarta.validation.Valid;import jakarta.validation.constraints.*;import jakarta.servlet.http.HttpServletRequest;
import java.util.*;import java.time.Instant;
@RestController @RequiredArgsConstructor
public class SecuritySupportController {
 private final SecuritySupportRequestRepository rows;
 private final Map<String,Deque<Instant>> rate=new LinkedHashMap<>();
 public record Create(@Email @NotBlank @Size(max=254)String contact,@NotBlank @Size(max=2000)String description){}
 public record Receipt(UUID id,String status){}
 @PostMapping("/support/security-access")
 public synchronized ApiResponse<Receipt> create(@Valid @RequestBody Create req,HttpServletRequest http){
  var now=Instant.now();var timestamps=rate.computeIfAbsent(http.getRemoteAddr()+":"+req.contact().strip().toLowerCase(Locale.ROOT),key->new ArrayDeque<>());
  timestamps.removeIf(t->t.isBefore(now.minusSeconds(3600)));if(timestamps.size()>=5)throw new AppException(ErrorCode.SECURITY_SUPPORT_RATE_LIMIT);
  if(rate.size()>10000)rate.remove(rate.keySet().iterator().next());timestamps.add(now);
  var r=new SecuritySupportRequest();r.setContact(req.contact().strip());r.setDescription(req.description().strip());r=rows.saveAndFlush(r);
  return ApiResponse.<Receipt>builder().code(1000).result(new Receipt(r.getId(),r.getStatus())).build();
 }
 @GetMapping("/admin/security-support")@PreAuthorize("hasRole('SUPER_ADMIN')")
 public ApiResponse<List<SecuritySupportRequest>> pending(){return ApiResponse.<List<SecuritySupportRequest>>builder().code(1000).result(rows.findTop100ByStatusOrderByCreatedAtAsc("OPEN")).build();}
}
