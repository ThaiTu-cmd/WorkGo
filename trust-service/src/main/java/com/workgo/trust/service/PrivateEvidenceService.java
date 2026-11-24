package com.workgo.trust.service;

import com.workgo.trust.entity.*;
import com.workgo.trust.enumeration.DisputeStatus;
import com.workgo.trust.exception.*;
import com.workgo.trust.repository.*;
import com.workgo.trust.utils.TokenUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.security.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.SecretKeySpec;

/** Local private adapter for development/QA. Production S3 adapter remains an explicit deployment dependency. */
@Service
public class PrivateEvidenceService {
    private final PrivateEvidenceRepository files;
    private final DisputeRepository disputes;
    private final TokenUtils token;
    private final TrustTransactions tx;
    private final Path root;
    private final byte[] signingKey;
    private final String publicBase;
    public PrivateEvidenceService(PrivateEvidenceRepository files,DisputeRepository disputes,TokenUtils token,TrustTransactions tx,
            @Value("${app.storage.local-dir:./.workgo-storage/trust}") String localDir,
            @Value("${app.storage.signing-key:}") String key,
            @Value("${app.storage.public-base-url:/api/v1/trust}") String publicBase){
        this.files=files;this.disputes=disputes;this.token=token;this.tx=tx;root=Path.of(localDir).toAbsolutePath().normalize();signingKey=key.getBytes(StandardCharsets.UTF_8);
        this.publicBase=publicBase.replaceAll("/+$","");
    }
    public PrivateEvidence upload(UUID id,MultipartFile file){
        participant(load(id));
        byte[] content;
        if(file==null||file.isEmpty()||file.getSize()>10L*1024*1024)throw new AppException(ErrorCode.INVALID_REQUEST);
        try(var in=file.getInputStream()){content=in.readNBytes(10*1024*1024+1);}catch(java.io.IOException e){throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
        if(content.length>10*1024*1024)throw new AppException(ErrorCode.INVALID_REQUEST);
        String mime=detect(content);if(mime==null)throw new AppException(ErrorCode.INVALID_REQUEST);
        String sha=digest(content);
        return tx.locked(List.of("order:"+load(id).getOrderId()),()->{
            var d=load(id);participant(d);
            if(d.getDecisionId()!=null||d.getStatus()!=DisputeStatus.OPEN&&d.getStatus()!=DisputeStatus.UNDER_REVIEW)throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
            UUID user=token.getCurrentUserId();if(files.countByDisputeIdAndUploaderId(id,user)>=10)throw new AppException(ErrorCode.INVALID_REQUEST);
            UUID fileId=UUID.randomUUID();
            try{Files.createDirectories(root);Files.write(root.resolve(fileId.toString()),content,StandardOpenOption.CREATE_NEW);}catch(java.io.IOException e){throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
            return files.saveAndFlush(new PrivateEvidence(fileId,id,user,mime,content.length,sha));
        });
    }
    public List<PrivateEvidence> list(UUID id){readAccess(load(id));return files.findByDisputeIdOrderByCreatedAtAsc(id);}
    public record Download(String url,Instant expiresAt){}
    public Download download(UUID fileId){var file=files.findById(fileId).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));readAccess(load(file.getDisputeId()));
        Instant expiry=Instant.now().plusSeconds(300);String signature=sign(fileId,expiry.getEpochSecond());
        return new Download(publicBase+"/evidence/"+fileId+"/content?expires="+expiry.getEpochSecond()+"&signature="+signature,expiry);
    }
    public record Content(byte[] bytes,String mime){}
    public Content content(UUID id,long expires,String signature){
        long now=Instant.now().getEpochSecond();
        if(expires<=now||expires>now+300||signature==null||!MessageDigest.isEqual(sign(id,expires).getBytes(StandardCharsets.US_ASCII),signature.getBytes(StandardCharsets.US_ASCII)))throw new AccessDeniedException("Expired or invalid download");
        var file=files.findById(id).orElseThrow(()->new AppException(ErrorCode.TARGET_NOT_FOUND));readAccess(load(file.getDisputeId()));
        try{byte[] bytes=Files.readAllBytes(root.resolve(id.toString()));if(!digest(bytes).equals(file.getChecksum()))throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);return new Content(bytes,file.getMimeType());}
        catch(java.io.IOException e){throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
    }
    private Dispute load(UUID id){return disputes.findById(id).orElseThrow(DisputeNotFoundException::new);}
    private void participant(Dispute d){if(!d.getClientId().equals(token.getCurrentUserId())&&!d.getProviderId().equals(token.getCurrentProviderIdOrNull()))throw new AccessDeniedException("Participant required");}
    private void readAccess(Dispute d){if(token.hasRole("ROLE_ADMIN")&&token.getCurrentUserId().equals(d.getAssignedAdminId()))return;participant(d);}
    private String sign(UUID id,long expiry){if(signingKey.length<32)throw new AppException(ErrorCode.DEPENDENCY_UNAVAILABLE);
        try{var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(signingKey,"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal((id+"|"+expiry).getBytes(StandardCharsets.UTF_8)));}catch(GeneralSecurityException e){throw new IllegalStateException(e);}}
    private static String digest(byte[] bytes){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
    private static String detect(byte[] b){
        if(b.length>=8&&Arrays.equals(Arrays.copyOf(b,8),new byte[]{(byte)137,80,78,71,13,10,26,10}))return "image/png";
        if(b.length>=3&&b[0]==(byte)255&&b[1]==(byte)216&&b[2]==(byte)255)return "image/jpeg";
        if(b.length>=5&&new String(b,0,5,StandardCharsets.US_ASCII).equals("%PDF-"))return "application/pdf";
        return null;
    }
}
