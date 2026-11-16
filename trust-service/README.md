# Trust Service

Infrastructure and service security follow the existing WorkGo backend structure.
Feign scanning and scheduling are enabled. Business logic, endpoints, entities,
scheduled workers and service integrations are planned separately.

## Stack

- Java 21, Spring Boot 3.3.6, Maven
- Spring Cloud 2023.0.6 / OpenFeign
- PostgreSQL / Spring Data JPA
- Lombok 1.18.48, MapStruct 1.6.3

## Structure

```text
src/main/java/com/workgo/trust/
  TrustServiceApplication.java
  configuration/
  controller/
  dto/request/
  dto/response/
  entity/
  enumeration/
  exception/
  mapper/
  repository/client/
  service/
  utils/
src/main/resources/application.yaml
src/test/java/com/workgo/trust/
```

## Local configuration

| Environment variable | Default |
| --- | --- |
| `TRUST_PORT` | `8087` |
| `TRUST_DB_PORT` | `5438` |
| `TRUST_DB` | `trust_db` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | Required, no default |

Context path: `/trust`.
Set `DB_PASSWORD` in the environment, then provision PostgreSQL with:

```powershell
docker compose up -d postgres-trust
```

Gateway route: `/api/v1/trust/**` (default upstream `http://localhost:8087`).
Only GET `/trust/providers/*/reviews` and `/trust/services/*/reviews` are public.
Gateway rejects `/api/v1/trust/internal/**` with HTTP 403.
The root runner is not wired up yet.

`app` configuration includes review publication, outbox retries, client timeouts,
and URLs for Identity, Catalog, Order, Payment, Job and Communication.
Supply `INTERNAL_API_KEY` through the environment for `/trust/internal/**` access.
The internal security chain requires `X-Internal-Key`; a missing or blank configured
key rejects every internal request. Bearer JWTs cannot replace this key.

The API security chain permits only the two public GET patterns above; all other
requests require a Bearer JWT. The Gateway introspects JWTs before forwarding them;
this service parses those verified claims and preserves `ROLE_*` authorities from
`scope`. Keep direct service access restricted to the trusted internal network.
Both security chains are stateless. Authentication failures return HTTP 401 with
the shared JSON response code `1006`.

Build from the repository root:

```powershell
.\mvnw.cmd -f trust-service/pom.xml clean package -DskipTests
```
