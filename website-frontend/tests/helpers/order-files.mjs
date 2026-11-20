import assert from 'node:assert/strict';

export const TEST_ORDER_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jAfcAAAAASUVORK5CYII=',
  'base64',
);

export async function uploadOrderImage(gatewayUrl, token, orderId, context, name) {
  const body = new FormData();
  body.set('context', context);
  body.set('file', new File([TEST_ORDER_IMAGE], name, { type: 'image/png' }));
  const response = await fetch(`${gatewayUrl}/order/orders/${orderId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await response.json();
  assert.equal(response.status, 200, `Order image upload failed: ${JSON.stringify(data)}`);
  assert.ok(data.result?.storedFileId);
  return data.result.storedFileId;
}
