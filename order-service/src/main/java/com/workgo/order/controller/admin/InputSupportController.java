package com.workgo.order.controller.admin;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.service.OrderInputSupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/admin/input-support") @RequiredArgsConstructor
public class InputSupportController {
    private final OrderInputSupportService support;
    @GetMapping public ApiResponse<Page<OrderInputSupportService.SupportItem>> queue(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.<Page<OrderInputSupportService.SupportItem>>builder().code(1000).result(support.queue(page,size)).build();
    }
}
