package com.workgo.order.service;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.reppository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
@Service @RequiredArgsConstructor
public class DeliveryReadinessService {
    private final StoredFileRepository files;
    private final DeliveryPackageRepository deliveries;
    private final WorkEvidenceRepository evidence;
    private final OrderFileService fileService;
    public boolean ready(Order o,Execution execution){
        if(o.getExecutionType()==ExecutionType.DIGITAL){
            var d=deliveries.findFirstByExecution_ExecutionIdOrderByVersionNoDesc(execution.getExecutionId()).orElse(null);
            return d!=null&&d.getStatus()==DeliveryPackageStatus.SUBMITTED&&d.getFiles()!=null&&!d.getFiles().isEmpty()
                    &&d.getFiles().stream().allMatch(f->readyFile(o,f.getStoredFileId()));
        }
        var after=evidence.findByExecution_ExecutionIdAndPhase(execution.getExecutionId(),EvidencePhase.AFTER,org.springframework.data.domain.Pageable.unpaged()).getContent();
        return !after.isEmpty()&&after.stream().allMatch(e->readyFile(o,e.getStoredFileId()));
    }
    private boolean readyFile(Order o,java.util.UUID id){
        if(id==null)return false;
        var f=files.findById(id).orElse(null);
        if(f==null||!o.getOrderId().equals(f.getOrderId())||!"READY".equals(f.getStatus())||f.getSizeBytes()==null||f.getSizeBytes()<=0)return false;
        try {byte[] bytes=fileService.readStoredContent(f);return bytes!=null&&bytes.length==f.getSizeBytes();}
        catch(RuntimeException e){return false;}
    }
}
