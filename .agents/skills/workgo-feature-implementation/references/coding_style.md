# WorkGo — Coding Style Reference

> Project: WorkGo — Java Spring Boot Microservices
> Stack: Java 21, Spring Boot 3.3.6, Spring Cloud 2023.0.6, PostgreSQL, Kafka, OpenFeign, Lombok 1.18.48, MapStruct 1.6.3

---

## Package Structure

```
com.workgo.<service>.<layer>
```

| Layer | Package | Notes |
|-------|---------|-------|
| Entity | `.entity` | JPA entities |
| Request DTO | `.dto.request` | Inbound |
| Response DTO | `.dto.response` | Outbound |
| Generic DTO | `.dto` | `ApiResponse<T>`, `PageResponse<T>` |
| Repository | `.repository` | Spring Data JPA |
| Service | `.service` | Business logic |
| Controller | `.controller` | REST endpoints |
| Mapper | `.Mapper` | MapStruct (PascalCase in identity-service) |
| Exception | `.Exception` | AppException, ErrorCode, GlobalExceptionHandler |
| Enum | `.enumeration` | All enums |
| Config | `.configuration` | Spring configs |
| Util | `.util` | Shared utilities |

---

## Entity Template

```java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "table_name_plural")
@SQLRestriction("is_deleted = 0")
public class Foo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "foo_id")
    UUID fooId;

    @Column(name = "field_name")
    String fieldName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    FooStatus status;

    @Builder.Default
    @Column(name = "created_at")
    Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    Instant updatedAt;

    @Builder.Default
    @Column(name = "is_deleted")
    int isDeleted = 0;

    //===FK===
    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;
}
```

**Rules:**
- ID: `UUID` + `GenerationType.UUID`
- Timestamp: `java.time.Instant`
- `@Builder.Default` for fields with default values
- `@FieldDefaults(level = AccessLevel.PRIVATE)` — no `private` keyword on fields
- Soft delete: `int isDeleted = 0` + `@SQLRestriction("is_deleted = 0")`
- Comment `//===FK===` before relation fields

---

## Request DTO Template

```java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FooCreationRequest {
    String field1;
    String field2;
}
```

---

## Response DTO Template

```java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FooResponse {
    UUID fooId;
    String field1;
    Instant createdAt;
}
```

---

## Generic Wrappers

```java
// ApiResponse.java — wraps every controller response
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code;
    private String message;
    private T result;
}

// PageResponse.java — wraps paginated results
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {
    int totalPages;
    int pageSize;
    long totalElements;
    int currentPage;
    List<T> data;
}
```

---

## Repository Template

```java
@Repository
public interface FooRepository extends JpaRepository<Foo, UUID> {
    Optional<Foo> findByUser_UserId(UUID userId);
    boolean existsByUser_UserId(UUID userId);
    Page<Foo> findAllByStatus(FooStatus status, Pageable pageable);
}
```

**Rules:**
- Always extends `JpaRepository<Entity, UUID>`
- Use Spring Data JPA derived query naming: `findBy*`, `existsBy*`, `findAllBy*`
- Prefer returning `Optional<Entity>` (not nullable reference like `findByUserName`)

---

## Mapper Template (MapStruct)

```java
@Mapper(componentModel = "spring")
public interface FooMapper {

    @Mapping(target = "userId", source = "user.userId")
    FooResponse toFooResponse(Foo foo);

    void updateFoo(@MappingTarget Foo foo, FooUpdateRequest request);
}
```

**Rules:**
- `componentModel = "spring"` always
- All mappers are interfaces (not abstract classes)
- `@Mapping` for field rename or nested path access
- `@MappingTarget` for in-place update methods
- Naming: `to{TargetType}(...)`, `update{Entity}(...)`

---

## ErrorCode Pattern

```java
@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum ErrorCode {
    //=============SYSTEM====================
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorize Exception", HttpStatus.INTERNAL_SERVER_ERROR),
    SUCCESS(1000, "Success", HttpStatus.ACCEPTED),

    //===============FOO====================
    FOO_EXISTED(10XX, "Foo already existed", HttpStatus.BAD_REQUEST),
    FOO_NOT_EXISTED(10XX, "Foo does not exist", HttpStatus.NOT_FOUND),

    ;
    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
```

**Rules:**
- Group errors by domain with `//===DOMAIN===` comment
- Numeric codes: continue from last used number
- Always include `EXISTED` and `NOT_EXISTED` variants for each entity

---

## Service Template

```java
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FooService {

    FooRepository fooRepository;
    FooMapper fooMapper;
    AttributeUtil attributeUtil;

    public FooResponse createFoo(FooCreationRequest request) {
        User user = attributeUtil.getCurrentUser();

        if (fooRepository.existsByUser_UserId(user.getUserId()))
            throw new AppException(ErrorCode.FOO_EXISTED);

        Foo foo = Foo.builder()
                .fieldName(request.getFieldName())
                .user(user)
                .build();

        fooRepository.save(foo);

        return fooMapper.toFooResponse(foo);
    }

    public FooResponse getFoo(UUID fooId) {
        Foo foo = fooRepository.findById(fooId)
                .orElseThrow(() -> new AppException(ErrorCode.FOO_NOT_EXISTED));
        return fooMapper.toFooResponse(foo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<FooResponse> getAllFoos(int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        var pageData = fooRepository.findAll(pageable);

        return PageResponse.<FooResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream().map(fooMapper::toFooResponse).toList())
                .build();
    }

    public FooResponse updateFoo(UUID fooId, FooUpdateRequest request) {
        Foo foo = fooRepository.findById(fooId)
                .orElseThrow(() -> new AppException(ErrorCode.FOO_NOT_EXISTED));

        fooMapper.updateFoo(foo, request);
        foo.setUpdatedAt(Instant.now());

        return fooMapper.toFooResponse(fooRepository.save(foo));
    }

    public void deleteFoo(UUID fooId) {
        Foo foo = fooRepository.findById(fooId)
                .orElseThrow(() -> new AppException(ErrorCode.FOO_NOT_EXISTED));

        foo.setIsDeleted(attributeUtil.createDeletedMark());  // soft delete
        fooRepository.save(foo);
    }
}
```

**Rules:**
- `@Service` + `@RequiredArgsConstructor` + `@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)`
- No service interfaces — direct concrete class injection
- `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")` for secured methods
- Always use `orElseThrow(() -> new AppException(ErrorCode.XXX))` — never null-check
- Soft delete: `setIsDeleted(attributeUtil.createDeletedMark())` — never hard delete

---

## Controller Template

```java
@RestController
@RequestMapping("/foos")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FooController {

    FooService fooService;

    @PostMapping
    ApiResponse<FooResponse> createFoo(@RequestBody FooCreationRequest request) {
        return ApiResponse.<FooResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(fooService.createFoo(request))
                .build();
    }

    @GetMapping("/{fooId}")
    ApiResponse<FooResponse> getFoo(@PathVariable UUID fooId) {
        return ApiResponse.<FooResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(fooService.getFoo(fooId))
                .build();
    }

    @GetMapping
    ApiResponse<PageResponse<FooResponse>> getAllFoos(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<FooResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(fooService.getAllFoos(page, size))
                .build();
    }

    @PutMapping("/{fooId}")
    ApiResponse<FooResponse> updateFoo(
            @PathVariable UUID fooId,
            @RequestBody FooUpdateRequest request
    ) {
        return ApiResponse.<FooResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(fooService.updateFoo(fooId, request))
                .build();
    }

    @DeleteMapping("/{fooId}")
    ApiResponse<Void> deleteFoo(@PathVariable UUID fooId) {
        fooService.deleteFoo(fooId);
        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }
}
```

**Rules:**
- `@RestController` + `@RequestMapping("/foos")` + `@RequiredArgsConstructor` + `@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)`
- Methods have **no `public` modifier** (package-private) — consistent with existing controllers
- Return type is always `ApiResponse<T>` — never `ResponseEntity`
- Path variables use `UUID` type directly — never `String`
- Pagination uses `@RequestParam` with defaults, NOT `Pageable` in controller signature
- Each method builds `ApiResponse` inline with the builder pattern

---

## AttributeUtil — Available Methods

```java
// Get the currently authenticated user from SecurityContext
User getCurrentUser()

// Generate a soft-delete mark (non-zero int based on Instant.now().getNano())
int createDeletedMark()
```

---

## SecurityConfig — Adding Public Endpoints

To allow unauthenticated access to a specific GET endpoint:

```java
httpSecurity.authorizeHttpRequests(request -> {
    request.requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
            .requestMatchers(HttpMethod.GET, "/foos/{fooId}").permitAll()  // add here
            .anyRequest().authenticated();
});
```
