package com.workgo.identity.controller.internal;
import com.workgo.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/users")
public class InternalUserStatusController {
    private final UserRepository users;
    @GetMapping("/{id}/active") public boolean active(@PathVariable UUID id){return users.findById(id).isPresent();}
}
