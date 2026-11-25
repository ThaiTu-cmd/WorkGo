package com.workgo.order.controller.admin;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.service.DigitalFlowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/admin/revision-support")
@RequiredArgsConstructor
public class RevisionSupportController {
    private final DigitalFlowService revisions;
    @GetMapping
    public ApiResponse<Page<DigitalFlowService.RevisionSupportItem>> queue(@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size) {
        return ApiResponse.<Page<DigitalFlowService.RevisionSupportItem>>builder().code(1000)
                .result(revisions.revisionSupportQueue(page, size)).build();
    }
}
