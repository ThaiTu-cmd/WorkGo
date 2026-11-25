package com.workgo.order.controller;
import com.workgo.order.dto.ApiResponse;
import com.workgo.order.service.meet.MeetOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequiredArgsConstructor @RequestMapping("/meet/authorization")
public class MeetAuthorizationController {
    private final MeetOAuthService oauth;
    // No generated toString: authorization code must not be written into logs.
    public static class Callback {
        public String state;
        public String code;
    }
    @PostMapping public ApiResponse<Map<String,String>> start(){return ok(oauth.start());}
    @PostMapping("/complete") public ApiResponse<Boolean> complete(@RequestBody Callback body){oauth.finish(body.state,body.code);return ok(true);}
    @DeleteMapping public ApiResponse<Boolean> disconnect(){oauth.disconnect();return ok(true);}
    private <T> ApiResponse<T> ok(T result){return ApiResponse.<T>builder().code(1000).result(result).build();}
}
