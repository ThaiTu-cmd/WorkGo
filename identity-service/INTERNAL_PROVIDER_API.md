# Internal provider lookup

Implemented on `feature/identity-service`. `GET /identity/internal/providers/{providerId}` returns a raw provider object, including `providerProfileId`, `userId`, provider display/rating fields, `verificationStatus`, `acceptingOrders`, `joinedAt` and **userStatus** (`ACTIVE` or `DISABLE`, reflecting the account row).

All `/internal/**` requests require `X-Internal-Key` matching nonblank `INTERNAL_API_KEY` (`app.internal-api-key`). Missing, wrong or blank configured keys return JSON 401. User bearer tokens alone cannot call internal APIs; the internal key does not authenticate public user endpoints. Existing public JWT parsing is unchanged.

Lookup uses a parameterized JDBC query joining provider_profiles and users, excluding deleted provider profiles. This deliberately bypasses User's ACTIVE-only ORM restriction: a disabled account returns its actual status instead of being hidden by an association lookup. Missing/deleted provider or missing linked user returns 404.

Consumers must require `userStatus == ACTIVE` and the appropriate verification status. `acceptingOrders` is separate from account active status. Job/Order callers must deploy the matching key-enabled clients and share the configured key. No key is embedded in source or examples.

Tests remain local: security + JDBC/HTTP fixtures (11 passing). A live PostgreSQL/service integration has not been run.
