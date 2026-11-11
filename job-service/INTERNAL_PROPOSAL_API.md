# Proposal source and Order bridge

Implemented on `feature/job-service`. `GET /job/internal/proposals/{id}` requires the existing internal-key authentication and returns a raw source snapshot with actual `proposalStatus`, `jobStatus`, `applicationStatus` plus IDs, execution type, price/currency, estimated days, title/description/location and terms. Missing/deleted Proposal, Application or Job returns 404. The endpoint reads data only; it does not accept proposals or create orders.

`OrderClient.createFromProposal(proposalId, request)` calls `POST /order/internal/orders/from-proposal` with `Idempotency-Key=proposalId` and `X-Internal-Key`. DTO fields match the Order contract. The scoped key configuration is shared with IdentityClient; CatalogClient does not get the key. Existing finite timeouts, no retry and no redirect remain in effect. The direct Order response includes orderId/proposalId/jobId/sourceType/status.

Identity's provider projection now includes `userStatus`. Future application validation must require ACTIVE separately from verificationStatus/acceptingOrders.

Deploy the matching Order and Identity branch changes with the same nonblank `INTERNAL_API_KEY`. Order's proposal endpoint currently accepts DIGITAL only; other execution types are explicit 400 until their scheduling/execution contracts are implemented. Step 7 must enforce that capability before accepting a proposal, rather than closing a Job and then discovering unsupported execution.

Acceptance/business controllers, durable outbox creation/retry and internal Job snapshot endpoint remain later plan work. Local suite: 92 passing tests; no live cross-service integration claim.
