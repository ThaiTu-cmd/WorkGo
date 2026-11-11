package com.workgo.job.controller;

import com.workgo.job.dto.response.AcceptedProposalResponse;
import com.workgo.job.service.ProposalSnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/proposals")
@RequiredArgsConstructor
public class InternalProposalController {
    private final ProposalSnapshotService snapshots;

    @GetMapping("/{id}")
    public AcceptedProposalResponse getProposal(@PathVariable("id") UUID id) {
        return snapshots.getSnapshot(id);
    }
}
