package com.workgo.job.repository.client;

import com.workgo.job.dto.response.ApiResponse;
import com.workgo.job.dto.response.client.CategoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "catalog-service", contextId = "jobCatalogClient", url = "${app.services.catalog}",
        configuration = JobFeignConfiguration.class)
public interface CatalogClient {
    @GetMapping("/categories/{categoryId}")
    ApiResponse<CategoryResponse> getCategory(@PathVariable("categoryId") UUID categoryId);
}
