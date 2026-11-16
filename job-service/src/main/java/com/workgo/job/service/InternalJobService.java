package com.workgo.job.service;

import com.workgo.job.dto.response.JobDetailDto;
import com.workgo.job.mapper.JobMapper;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class InternalJobService {
    private final JobAccess access;
    private final JobMapper mapper;

    public JobDetailDto job(UUID id) { return mapper.toDetail(access.read(id), null); }

}
