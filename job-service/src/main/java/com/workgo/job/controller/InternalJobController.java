package com.workgo.job.controller;

import com.workgo.job.dto.response.*;
import com.workgo.job.service.InternalJobService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/internal") @RequiredArgsConstructor
@PreAuthorize("hasAuthority('INTERNAL_SERVICE')")
public class InternalJobController {
    private final InternalJobService service;
    @GetMapping("/jobs/{id}")
    public JobDetailDto job(@PathVariable UUID id) { return service.job(id); }
}
