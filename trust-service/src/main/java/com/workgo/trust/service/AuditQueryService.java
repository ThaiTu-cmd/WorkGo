package com.workgo.trust.service;

import com.workgo.trust.entity.TrustAdminAudit;
import com.workgo.trust.repository.TrustAdminAuditRepository;
import com.workgo.trust.exception.*;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class AuditQueryService {
    private final TrustAdminAuditRepository audits;
    public record AuditRecord(UUID id, UUID actorId, String actorRole, String action, String targetType,
        UUID targetId, String reason, String beforeState, String afterState, String correlationId,
        String source, Instant createdAt) {}
    @Transactional(readOnly=true)
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public Page<AuditRecord> search(UUID actorId, UUID targetId, String action, String targetType,
                                    Instant from, Instant to, int page, int size, String sort) {
        if (page<0 || size<1 || size>100 || from!=null && to!=null && !from.isBefore(to))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        if (!java.util.Set.of("createdAt,desc","createdAt,asc","id,desc","id,asc").contains(sort))
            throw new AppException(ErrorCode.INVALID_REQUEST);
        Sort ordering=Sort.by(sort.startsWith("id,") ? new String[]{"id"} : new String[]{"createdAt","id"});
        ordering=sort.endsWith(",asc") ? ordering.ascending() : ordering.descending();
        var auth=SecurityContextHolder.getContext().getAuthentication();
        boolean monitor=auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        UUID scope=monitor ? actorId : UUID.fromString(((Jwt)auth.getPrincipal()).getClaimAsString("userId"));
        return audits.search(monitor ? null : scope,actorId,targetId,action,targetType,from,to,
            PageRequest.of(page,size,ordering)).map(AuditQueryService::projection);
    }
    public record ExportPage(String csv, Integer nextCursor) {}
    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ExportPage export(UUID actorId, UUID targetId, String action, String targetType,
                             Instant from, Instant to, int cursor, int limit) {
        if (from==null || to==null || !from.isBefore(to) || java.time.Duration.between(from,to).compareTo(java.time.Duration.ofDays(92))>0
            || cursor<0 || limit<1 || limit>1000 || (long)cursor*limit>1_000_000L)
            throw new AppException(ErrorCode.INVALID_REQUEST);
        var data=audits.search(null,actorId,targetId,action,targetType,from,to,PageRequest.of(cursor,limit,Sort.by("createdAt","id").ascending()));
        var csv=new StringBuilder("id,actorId,actorRole,action,targetType,targetId,correlationId,source,createdAt\n");
        for(var l:data) csv.append(String.join(",",cell(l.getId()),cell(l.getActorId()),cell(l.getActorRole()),cell(l.getAction()),cell(l.getTargetType()),cell(l.getTargetId()),cell(l.getCorrelationId()),cell(l.getSource()),cell(l.getCreatedAt()))).append("\n");
        var auth=SecurityContextHolder.getContext().getAuthentication();
        UUID actor=UUID.fromString(((Jwt)auth.getPrincipal()).getClaimAsString("userId"));
        audits.save(TrustAdminAudit.exported(actor,"{\"rowCount\":"+data.getNumberOfElements()+",\"cursor\":"+cursor+",\"limit\":"+limit+"}"));
        return new ExportPage(csv.toString(),data.hasNext()?cursor+1:null);
    }
    private static String cell(Object value) {
        if(value==null)return "";
        String text=value.toString();
        if(!text.isEmpty() && "=+-@\t\r\n".indexOf(text.charAt(0))>=0)text="'"+text;
        return "\""+text.replace("\"","\"\"")+"\"";
    }
    private static AuditRecord projection(TrustAdminAudit l) {
        return new AuditRecord(l.getId(),l.getActorId(),l.getActorRole(),l.getAction(),l.getTargetType(),
            l.getTargetId(),null,null,null,l.getCorrelationId(),l.getSource(),l.getCreatedAt());
    }
}
