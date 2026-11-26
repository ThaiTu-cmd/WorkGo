package com.workgo.order.controller.internal;
import com.workgo.order.entity.ProviderRestrictionProjection;import com.workgo.order.reppository.ProviderRestrictionProjectionRepository;
import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import org.springframework.transaction.annotation.Transactional;import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/providers")
public class ProviderRestrictionProjectionController {
 private final ProviderRestrictionProjectionRepository rows;
 public record Change(String source,long sourceVersion,Boolean blocked){}
 @PutMapping("/{id}/restrictions") @Transactional
 public ProviderRestrictionProjection apply(@PathVariable UUID id,@RequestBody Change req){
  if(req==null||req.blocked()==null||!Set.of("SANCTION","REPUTATION").contains(req.source())||req.sourceVersion()<1)throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST);
  var r=rows.findById(id+":"+req.source()).orElseGet(()->new ProviderRestrictionProjection(id,req.source()));
  if(req.sourceVersion()==r.getSourceVersion()&&r.isBlocked()!=req.blocked())throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT);
  if(req.sourceVersion()>r.getSourceVersion()){r.setSourceVersion(req.sourceVersion());r.setBlocked(req.blocked());rows.saveAndFlush(r);}return r;
 }
}
