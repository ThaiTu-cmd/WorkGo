package com.workgo.payment.controller.internal;

import com.workgo.payment.dto.response.FeePolicyResponse;
import com.workgo.payment.service.FeePolicyService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/fee-policies")
public class InternalFeePolicyController {

    FeePolicyService feePolicyService;

    @GetMapping("/{id}") public FeePolicyResponse version(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id){return feePolicyService.getVersion(id);}

    //order chot phien ban phi vao snapshot luc tao don
    @GetMapping("/current")
    FeePolicyResponse getCurrent() {
        return feePolicyService.getCurrent();
    }

}
