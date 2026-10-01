# WorkGo — Project Structure Reference

## Microservices Overview

```
WorkGo/
├── api-gateway/          # Spring Cloud Gateway
├── identity-service/     # Auth, User, Address, ProviderProfile
├── catalog-service/      # Service, Category
├── order-service/        # Orders (WIP)
├── payment-service/      # Payments (WIP)
├── web-app/              # Frontend
└── docker-compose.yml
```

## identity-service — Source Tree

```
src/main/java/com/workgo/identity/
├── IdentityServiceApplication.java
├── configuration/
│   ├── ApplicationInitConfig.java      # DB seeder (roles + admin user)
│   ├── CustomJwtDecoder.java
│   └── SecurityConfig.java
├── controller/
│   ├── AddressController.java
│   ├── AuthenticationController.java
│   ├── ProviderProfileController.java  # (to be added)
│   └── UserController.java
├── dto/
│   ├── ApiResponse.java                # Universal response wrapper
│   ├── PageResponse.java               # Pagination wrapper
│   ├── request/
│   │   ├── AddressCreationRequest.java
│   │   ├── AddressUpdateRequest.java
│   │   ├── AuthenticationRequest.java
│   │   ├── IntrospectRequest.java
│   │   ├── LogoutRequest.java
│   │   ├── UserCreationRequest.java
│   │   └── UserUpdateRequest.java
│   └── response/
│       ├── AddressResponse.java
│       ├── AuthenticationResponse.java
│       ├── IntrospectResponse.java
│       ├── RoleResponse.java
│       ├── UserCreationResponse.java
│       └── UserResponse.java
├── entity/
│   ├── Address.java
│   ├── InvalidatedToken.java
│   ├── ProviderProfile.java
│   ├── Role.java
│   ├── User.java
│   └── UserRole.java
├── enumeration/
│   ├── ProviderType.java
│   ├── RoleName.java          # Used as @Id in Role entity
│   ├── UserStatus.java        # ACTIVE, DISABLE
│   └── VertificationStatus.java
├── Exception/                 # ⚠️ PascalCase package (inconsistency vs catalog-service)
│   ├── AppException.java
│   ├── ErrorCode.java
│   └── GlobalExceptionHandler.java
├── Mapper/                    # ⚠️ PascalCase package (inconsistency vs catalog-service)
│   ├── AddressMapper.java
│   ├── RoleMapper.java
│   └── UserMapper.java
├── repository/
│   ├── AddressRepository.java
│   ├── InvalidatedTokenRepository.java
│   ├── RoleRepository.java
│   ├── UserRepository.java
│   └── UserRoleRepository.java
├── service/
│   ├── AddressService.java
│   ├── AuthenticationService.java
│   └── UserService.java
└── util/
    └── AttributeUtil.java
```

## catalog-service — Source Tree

```
src/main/java/com/workgo/catalog/
├── CategoryServiceApplication.java
├── configuration/
│   ├── CustomJwtDecoder.java
│   ├── JwtAuthenticationEntryPoint.java
│   └── SecurityConfig.java
├── controller/
│   ├── CategoryController.java
│   └── ServiceController.java          # Currently commented out (WIP)
├── dto/
│   ├── ApiResponse.java
│   ├── PageResponse.java
│   ├── request/
│   │   ├── CategoryCreationRequest.java
│   │   ├── CategoryUpdateRequest.java
│   │   ├── ServiceCreationRequest.java
│   │   └── ServiceUpdateRequest.java
│   └── response/
│       ├── CategoryCreationResponse.java
│       ├── CategoryResponse.java
│       ├── CategorySecondResponse.java
│       ├── ServiceCreationResponse.java
│       └── ServiceResponse.java
├── entity/
│   ├── Category.java
│   └── Service.java
├── enumeration/
│   ├── ExecutionType.java
│   └── ServiceStatus.java
├── exception/                           # lowercase (correct convention)
│   ├── AppException.java
│   ├── ErrorCode.java
│   └── GlobalExceptionHandler.java
├── mapper/                              # lowercase (correct convention)
│   ├── CategoryMapper.java
│   └── ServiceMapper.java
├── repository/
│   ├── CategoryRepository.java
│   └── ServiceRepository.java
│   └── httpclient/
│       └── IdentityClient.java         # OpenFeign client
└── service/
    ├── CategoryService.java
    └── ServiceService.java
```

## Key Entities & Their Relationships

```
User (1) ──── (N) UserRole (N) ──── (1) Role
User (1) ──── (N) Address
User (1) ──── (1) ProviderProfile

Category (1) ──── (N) Service   [catalog-service]
```

## ErrorCode Number Ranges

| Range | Domain |
|-------|--------|
| 9999 | SYSTEM (uncategorized) |
| 1000 | SUCCESS |
| 1001–1022 | USER / AUTH / ADDRESS |
| 1023–1025 | PROVIDER (newly added) |
| Next available: 1026+ | |

## RoleName Values

```java
public enum RoleName {
    ADMIN,
    CLIENT,
    PROVIDER
}
```

## Security: JWT Structure

- Algorithm: HS512
- Claims: `sub` (userName), `scope` (space-delimited `ROLE_XXX`), `userId`, `iss`, `iat`, `exp`, `jti`
- Authority prefix: empty string (roles stored as `ROLE_ADMIN` in scope)
- Authorities claim name: `"scope"`
- Expiry: 24 hours
- Logout: token invalidated via `InvalidatedToken` entity (JWT ID stored in DB)
