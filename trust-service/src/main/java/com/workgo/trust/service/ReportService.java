package com.workgo.trust.service;
import com.workgo.trust.dto.request.ReportReq;
import com.workgo.trust.dto.response.*;
import com.workgo.trust.entity.Report;
import com.workgo.trust.enumeration.*;
import com.workgo.trust.exception.*;
import com.workgo.trust.mapper.ReportMapper;
import com.workgo.trust.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
@Service @RequiredArgsConstructor
public class ReportService {
    private final ReportRepository repository;
    private final ReportMapper mapper;
    private final TrustTransactions transactions;
    private ReportTargetType normalize(ReportTargetType type) { return type == ReportTargetType.JOB ? ReportTargetType.POST : type; }
    public ReportDto create(ReportReq req, UUID user, UUID provider) {
        var type = normalize(req.targetType());
        if (type == ReportTargetType.USER && (req.targetId().equals(user) || req.targetId().equals(provider))) throw new AppException(ErrorCode.CANNOT_REPORT_SELF);
        TrustSupport.evidence(req.evidenceUrl());
        return transactions.locked(List.of("report:" + user + ":" + type + ":" + req.targetId()), () -> {
            if (repository.existsByReporterIdAndTargetTypeAndTargetIdAndStatusIn(user,type,req.targetId(),List.of(ReportStatus.PENDING,ReportStatus.REVIEWING)))
                throw new AppException(ErrorCode.DUPLICATE_ACTIVE_REPORT);
            return mapper.toDto(repository.saveAndFlush(Report.builder().reporterId(user).targetType(type).targetId(req.targetId())
                    .reason(req.reason()).description(req.description()).evidenceUrl(req.evidenceUrl()).build()));
        });
    }
    public ReportDto get(UUID id, UUID user) {
        var report = repository.findById(id).orElseThrow(ReportNotFoundException::new);
        if (!report.getReporterId().equals(user)) throw new AppException(ErrorCode.UNAUTHORIZED);
        return mapper.toDto(report);
    }
    public PageResponse<ReportDto> myReports(UUID user, ReportStatus status, ReportTargetType type, int page, int size) {
        return TrustSupport.response(repository.findMyReports(user,status,normalize(type),TrustSupport.page(page,size,"reportId")).map(mapper::toDto));
    }
}
