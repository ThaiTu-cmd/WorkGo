package com.workgo.payment.controller.admin;
import com.workgo.payment.reppository.EscrowAccountRepository;
import com.workgo.payment.mapper.EscrowMapper;
import com.workgo.payment.dto.ApiResponse;
import com.workgo.payment.dto.response.EscrowAccountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
@RestController @RequiredArgsConstructor @RequestMapping("/admin/escrows")
public class AdminEscrowController {
    private final EscrowAccountRepository escrows;
    private final EscrowMapper mapper;
    @GetMapping @PreAuthorize("hasRole('SUPER_ADMIN')") @Transactional(readOnly=true)
    public ApiResponse<Page<EscrowAccountResponse>> list(@RequestParam(defaultValue="0") int page) {
        return ApiResponse.<Page<EscrowAccountResponse>>builder().code(1000).result(escrows.findAll(PageRequest.of(Math.max(0,page),20,Sort.by("createdAt").descending())).map(mapper::toResponse)).build();
    }
}
