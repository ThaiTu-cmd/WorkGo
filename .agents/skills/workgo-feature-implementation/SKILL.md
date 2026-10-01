---
name: workgo-feature-implementation
description: >-
  Use this skill whenever the user asks to implement, complete, or add a new
  feature to the WorkGo Spring Boot microservices project. This skill covers
  the project's coding style, conventions, layered architecture workflow, and
  output rules (artifact-only, never write directly to source files unless
  explicitly told to). Activate when user says things like "viết code cho",
  "hoàn thiện phần", "thêm feature", "implement", or similar.
---

# WorkGo — Feature Implementation Skill

## ⚠️ Critical Output Rule

> **NEVER write code directly into source files.**
> Always output code in a **Markdown artifact** so the user can read, understand, and manually copy it.
> This is non-negotiable unless the user explicitly says "viết thẳng vào file" or "write directly".

---

## Step 1 — Research Before Writing

Before writing any code, always read the relevant existing files to understand context:

1. Read the entity the feature relates to (e.g., `entity/Foo.java`)
2. Read a similar, fully implemented feature for reference (e.g., `AddressService`, `AddressController`, `AddressMapper`)
3. Check `Exception/ErrorCode.java` for existing error codes
4. Check `util/AttributeUtil.java` for available utility methods
5. Check `configuration/SecurityConfig.java` for public endpoint patterns

Reference files for each service are documented in:
- [Coding Style Reference](./references/coding_style.md)
- [Project Structure Reference](./references/project_structure.md)

---

## Step 2 — Plan What to Create

For any new feature domain `Foo`, the standard set of files is:

| # | Action | File |
|---|--------|------|
| 1 | SỬA / TẠO | `enumeration/FooStatus.java` (nếu cần enum mới) |
| 2 | SỬA | `entity/Foo.java` (nếu entity chưa đúng style) |
| 3 | TẠO | `repository/FooRepository.java` |
| 4 | TẠO | `dto/request/FooCreationRequest.java` |
| 5 | TẠO | `dto/request/FooUpdateRequest.java` |
| 6 | TẠO | `dto/response/FooResponse.java` |
| 7 | TẠO | `Mapper/FooMapper.java` |
| 8 | SỬA | `Exception/ErrorCode.java` (thêm error codes mới) |
| 9 | TẠO | `service/FooService.java` |
| 10 | TẠO | `controller/FooController.java` |
| 11 | SỬA | `configuration/SecurityConfig.java` (nếu cần public endpoint) |

---

## Step 3 — Write the Artifact

Write all code in a single Markdown artifact. Structure it as:
- One `##` heading per file
- State the exact file path
- Code block with the full class
- Brief comment explaining key design decisions if non-obvious

Follow **every rule** in [coding_style.md](./references/coding_style.md) strictly.

---

## Step 4 — End the Artifact with a Summary Table

Always close the artifact with a table listing every file (action + path), so the user knows exactly what to create/modify.

---

## Common Pitfalls to Avoid

- ❌ Do NOT use `@Data` on JPA entities → use `@Getter @Setter` separately
- ❌ Do NOT write `private` on fields → use `@FieldDefaults(level = AccessLevel.PRIVATE)`
- ❌ Do NOT use `@Autowired` field injection → use `@RequiredArgsConstructor`
- ❌ Do NOT return `ResponseEntity` from controllers → always return `ApiResponse<T>`
- ❌ Do NOT null-check after `findById` → always use `.orElseThrow(() -> new AppException(ErrorCode.XXX))`
- ❌ Do NOT hard-delete → use soft delete (set `isDeleted = attributeUtil.createDeletedMark()`)
- ❌ Do NOT create new `BCryptPasswordEncoder` inline → inject the `PasswordEncoder` bean
