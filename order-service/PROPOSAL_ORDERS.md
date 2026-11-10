# Orders from accepted proposals

Implemented on `feature/order-service`. Requires the matching Identity and Job changes from their service branches before integration.

`POST /order/internal/orders/from-proposal` accepts `X-Internal-Key` and `Idempotency-Key` (UUID equal to `proposalId`). Body fields:

```json
{
  "proposalId": "11111111-1111-1111-1111-111111111111",
  "jobId": "22222222-2222-2222-2222-222222222222",
  "clientId": "33333333-3333-3333-3333-333333333333",
  "providerId": "44444444-4444-4444-4444-444444444444",
  "executionType": "DIGITAL",
  "price": 2500000.50,
  "currency": "VND",
  "estimatedDays": 5,
  "jobTitle": "Design logo",
  "jobDescription": "Agreed brief",
  "locationSnapshot": null,
  "terms": "Agreed terms"
}
```

Order re-reads `GET {JOB_SERVICE_URL}/internal/proposals/{proposalId}` with its internal key. Proposal and Application must be ACCEPTED, Job CLOSED; IDs, price, currency, days and all supplied snapshots/terms must match the authoritative source. Unverifiable sources do not create orders. The Job endpoint must be deployed; its absence is not treated as authorization to create an order.

The direct response contains `orderId`, `proposalId`, `jobId`, `sourceType=PROPOSAL`, `status`. First creation returns 201, identical replay 200 with the same order ID without another Job call; a different payload returns 409. Invalid request/key ID is 400, absent/wrong service credentials 401, unavailable Job 503. Repeating the same proposal after soft deletion is rejected rather than creating another order.

Order, source/pricing snapshot, proposal item, DIGITAL execution and creation history share one local database transaction. The nullable proposal slot plus CHECK and unique key reserves one Order per proposal, including deleted rows, while repeated SERVICE purchases remain legal. Concurrent insert losers reread the committed winner in a fresh transaction. Numeric price scale alone does not change request identity.

Only DIGITAL is supported by this proposal endpoint. Other types return 400: Proposal does not yet carry the slot/schedule contract required by the existing ONSITE execution flow. Existing SERVICE ordering remains unchanged. Digital execution starts at AWAITING_REQUIREMENTS with zero revisions; its deadline starts on requirement submission using the negotiated `estimatedDays`. Platform fee follows the existing `order.platform-fee-rate`, client pays the negotiated price.

Configuration: set the same nonblank `INTERNAL_API_KEY` in participating services. `JOB_SERVICE_URL` defaults to `http://localhost:8085/job`. Internal Job/Identity clients send the key, disable redirects/retries, and default to connect/read timeouts of 2s/5s (`ORDER_CLIENT_CONNECT_TIMEOUT_MS`, `ORDER_CLIENT_READ_TIMEOUT_MS`). Catalog does not receive their key interceptor.

Before deployment to an existing PostgreSQL database, apply `src/main/resources/db/manual/20261111_proposal_order_contract.sql` through the deployment migration process. It adds source slots/snapshots and replaces the old item-type CHECK to permit PROPOSAL. Reconcile any legacy duplicate proposal orders first. Do not rely on `ddl-auto:update` to replace existing CHECK constraints. This script is not auto-executed by the application.

Verification uses H2 PostgreSQL mode and local HTTP fixtures. The PostgreSQL migration and live cross-service flow have not run. Job acceptance/outbox processing still belongs to plan step 7; this endpoint does not perform a distributed transaction or accept a proposal.
