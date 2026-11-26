package com.workgo.job.operations;
import com.workgo.job.service.storage.FileStorage;
import org.springframework.web.bind.annotation.*;import org.springframework.http.*;import lombok.RequiredArgsConstructor;
import java.util.*;import java.time.Instant;
/** An explicit internal drill writes only a temporary probe object, verifies bytes and removes it. */
@RestController @RequiredArgsConstructor @RequestMapping("/internal/operations")
public class StorageOperations {
 private final FileStorage storage;
 private volatile long checkedAt;
 private volatile int up=-1;
 @PostMapping("/storage-probe") public Map<String,Object> probe(){
  String key="operations/probes/"+UUID.randomUUID();boolean deleted=false;byte[] bytes=UUID.randomUUID().toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
  try{storage.put(key,bytes,"application/octet-stream");if(!Arrays.equals(bytes,storage.get(key)))throw new IllegalStateException();storage.delete(key);deleted=true;up=1;checkedAt=Instant.now().getEpochSecond();return Map.of("verified",true,"checkedAt",checkedAt);}
  catch(RuntimeException failure){up=0;checkedAt=Instant.now().getEpochSecond();throw new org.springframework.web.server.ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Storage probe failed");}
  finally{if(!deleted)try{storage.delete(key);}catch(RuntimeException ignored){up=0;}}
 }
 @GetMapping(value="/storage-metrics",produces="text/plain;version=0.0.4") public String metrics(){return "workgo_storage_probe_up{service=\"job\"} "+up+"\nworkgo_storage_probe_age_seconds{service=\"job\"} "+(checkedAt==0?-1:Instant.now().getEpochSecond()-checkedAt)+"\n";}
}
