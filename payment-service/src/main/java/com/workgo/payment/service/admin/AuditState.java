package com.workgo.payment.service.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.util.Set;

/** Audit snapshots are structural metadata, never arbitrary request/response DTOs. */
final class AuditState {
    private AuditState() {}
    private static final Set<String> FIELDS = Set.of("status", "roles", "updatedFields", "deleted",
        "rowCount", "from", "to", "actorId", "action", "targetType", "targetId", "version",
        "orderSyncStatus", "moderationHidden", "active", "amount", "currency", "rate",
        "page", "limit", "cursor", "nextCursor", "feePolicyVersionId", "versionNo", "successFeeRate", "cancellationFeeRate", "cancellationFeeCap", "effectiveFrom", "createdBy", "createdAt", "payoutId", "payoutCode", "topUpId", "topUpCode", "userId", "gateway", "paymentMethod", "processingAt", "finishedAt", "confirmedAt", "expiresAt");
    static JsonNode redact(JsonNode node) {
        if (node == null || node.isNull()) return NullNode.instance;
        if (node.isObject()) {
            ObjectNode result = JsonNodeFactory.instance.objectNode();
            node.fields().forEachRemaining(e -> result.set(e.getKey(), FIELDS.contains(e.getKey())
                ? redact(e.getValue()) : TextNode.valueOf("[REDACTED]")));
            return result;
        }
        if (node.isArray()) {
            ArrayNode result = JsonNodeFactory.instance.arrayNode();
            node.forEach(v -> result.add(redact(v)));
            return result;
        }
        return node;
    }
}
