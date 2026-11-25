package com.workgo.communication.service;

import com.workgo.communication.entity.CommunicationAudit;
import com.workgo.communication.dto.response.PageResponse;
import com.workgo.communication.exception.*;
import com.workgo.communication.repository.CommunicationTransactions;
import com.workgo.communication.configuration.CorrelationTrace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class AuditLogQueryService {
    private final MongoTemplate mongo;
    private final CommunicationTransactions transactions;
    public record AuditRecord(UUID adminActionLogId,UUID actorId,String actorRole,String action,String targetType,
        UUID targetId,String correlationId,String source,Instant createdAt) {}
    public record ExportPage(String csv,Integer nextCursor) {}
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public PageResponse<AuditRecord> searchLogs(UUID actorId,String action,String targetType,String targetId,
                                                Instant from,Instant to,int page,int size) {
        if(page<0 || size<1 || (long)page*Math.min(size,100)>1_000_000L) invalid();
        int bounded=Math.min(size,100);
        Query query=filters(isSuperAdmin()?actorId:actor(),action,targetType,targetId,from,to);
        long count=mongo.count(query,CommunicationAudit.class);
        var data=mongo.find(query.with(Sort.by("createdAt","id").descending()).skip((long)page*bounded).limit(bounded),CommunicationAudit.class);
        return PageResponse.<AuditRecord>builder().data(data.stream().map(AuditLogQueryService::projection).toList())
            .currentPage(page).pageSize(bounded).totalElements(count).totalPages((int)((count+bounded-1)/bounded)).build();
    }
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ExportPage exportPage(UUID actorId,String action,String targetType,String targetId,
                                  Instant from,Instant to,int cursor,int limit) {
        if(from==null || to==null || !from.isBefore(to) || Duration.between(from,to).compareTo(Duration.ofDays(92))>0
            || cursor<0 || limit<1 || limit>1000 || (long)cursor*limit>1_000_000L) invalid();
        return transactions.execute(()->{
            var query=filters(actorId,action,targetType,targetId,from,to);
            var rows=mongo.find(query.with(Sort.by("createdAt","id").ascending()).skip((long)cursor*limit).limit(limit+1),CommunicationAudit.class);
            boolean more=rows.size()>limit;
            var csv=new StringBuilder("id,actorId,actorRole,action,targetType,targetId,correlationId,source,createdAt\n");
            for(var row:rows.subList(0,Math.min(limit,rows.size())))csv.append(String.join(",",cell(row.id()),cell(row.actorId()),cell(row.actorRole()),cell(row.action()),cell(row.targetType()),cell(row.targetId()),cell(row.correlationId()),cell(row.source()),cell(row.createdAt()))).append("\n");
            var auth=SecurityContextHolder.getContext().getAuthentication();
            String roles=auth.getAuthorities().stream().map(a->a.getAuthority()).filter(a->a.startsWith("ROLE_")).map(a->a.substring(5)).sorted().collect(java.util.stream.Collectors.joining(","));
            mongo.insert(new CommunicationAudit(UUID.randomUUID(),actor(),roles,"AUDIT_EXPORTED","AUDIT_LOG",UUID.randomUUID(),"Audit export",null,
                "{\"cursor\":"+cursor+",\"limit\":"+limit+",\"rowCount\":"+Math.min(limit,rows.size())+"}",CorrelationTrace.current(),"COMMUNICATION",Instant.now()));
            return new ExportPage(csv.toString(),more?cursor+1:null);
        });
    }
    private Query filters(UUID actorId,String action,String targetType,String targetId,Instant from,Instant to) {
        if(from!=null && to!=null && !from.isBefore(to))invalid();
        var query=new Query();
        if(actorId!=null)query.addCriteria(Criteria.where("actorId").is(actorId));
        if(action!=null)query.addCriteria(Criteria.where("action").is(action));
        if(targetType!=null)query.addCriteria(Criteria.where("targetType").is(targetType));
        if(targetId!=null){try{query.addCriteria(Criteria.where("targetId").is(UUID.fromString(targetId)));}catch(IllegalArgumentException e){invalid();}}
        if(from!=null || to!=null){var time=Criteria.where("createdAt");if(from!=null)time.gte(from);if(to!=null)time.lt(to);query.addCriteria(time);}
        return query;
    }
    private boolean isSuperAdmin(){return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_SUPER_ADMIN"));}
    private UUID actor(){return UUID.fromString(((Jwt)SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getClaimAsString("userId"));}
    private static AuditRecord projection(CommunicationAudit r){return new AuditRecord(r.id(),r.actorId(),r.actorRole(),r.action(),r.targetType(),r.targetId(),r.correlationId(),r.source(),r.createdAt());}
    private static void invalid(){throw new AppException(ErrorCode.INVALID_REQUEST);}
    private static String cell(Object value){if(value==null)return "";String text=value.toString();if(!text.isEmpty() && "=+-@\t\r\n".indexOf(text.charAt(0))>=0)text="'"+text;return "\""+text.replace("\"","\"\"")+"\"";}
}
