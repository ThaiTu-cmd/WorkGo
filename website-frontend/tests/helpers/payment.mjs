// E2E helpers for the real payment flow: payment-service creates a MOCK payment,
// the dev endpoint settles it (what VNPay / MoMo IPN would do), and payment-service
// confirms the order in order-service right after its commit.
// Needs payment-service running with the "dev" profile (its default).

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(res) {
  return res.json().catch(() => null);
}

export async function createMockPayment(gatewayUrl, token, orderId) {
  const res = await fetch(`${gatewayUrl}/payment/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': `e2e-${orderId}-${Date.now()}`,
    },
    body: JSON.stringify({ orderId, gateway: 'MOCK' }),
  });
  const data = await json(res);
  if (!res.ok || !data?.result?.paymentCode) {
    throw new Error(`Create payment failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data.result;
}

// Pays `orderId` and waits until order-service reports it CONFIRMED.
// Returns { payment, order }.
export async function payViaMock(gatewayUrl, token, orderId, { timeoutMs = 10000 } = {}) {
  const payment = await createMockPayment(gatewayUrl, token, orderId);
  const settle = await fetch(`${gatewayUrl}/payment/dev/payments/${payment.paymentCode}/success`, {
    method: 'POST',
  });
  if (!settle.ok) {
    throw new Error(`Settle mock payment failed (${settle.status}): ${JSON.stringify(await json(settle))}`);
  }
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const res = await fetch(`${gatewayUrl}/order/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    last = (await json(res))?.result?.order ?? null;
    if (last?.orderStatus === 'CONFIRMED') return { payment, order: last };
    await sleep(300);
  }
  throw new Error(`Order ${orderId} not CONFIRMED after payment (last: ${last?.orderStatus})`);
}

// ONSITE, client only, while CONFIRMED.
export async function getCheckinCode(gatewayUrl, token, orderId) {
  const res = await fetch(`${gatewayUrl}/order/orders/onsite/${orderId}/checkin-code`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await json(res);
  if (!res.ok) throw new Error(`Get checkin code failed (${res.status}): ${JSON.stringify(data)}`);
  return data?.result?.checkinCode;
}
