package com.workgo.payment.reppository.client;

import com.workgo.payment.dto.gateway.MoMoCreateRequest;
import com.workgo.payment.dto.gateway.MoMoCreateResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

//goi ra ngoai -> khong dung FeignInternalConfig (khong gui X-Internal-Key cho MoMo)
@FeignClient(name = "momo", url = "${payment.momo.endpoint}")
public interface MoMoClient {

    @PostMapping("/create")
    MoMoCreateResponse create(@RequestBody MoMoCreateRequest request);

}
