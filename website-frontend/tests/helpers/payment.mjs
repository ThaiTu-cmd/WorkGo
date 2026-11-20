import { randomUUID } from 'node:crypto';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(res) {
  return res.json().catch(() => null);
}

export async function topUpFromMockGateway(gatewayUrl, token, amount) {
  const res = await fetch(`${gatewayUrl}/payment/wallet/top-ups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': randomUUID(),
    },
    body: JSON.stringify({ amount, gateway: 'MOCK' }),
  });
  const data = await json(res);
  if (!res.ok || !data?.result?.topUpCode) {
    throw new Error(`Top-up creation failed (${res.status}): ${JSON.stringify(data)}`);
  }
  const settle = await fetch(`${gatewayUrl}/payment/dev/payments/top-ups/${data.result.topUpCode}/success`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await json(settle);
  if (!settle.ok || result?.result?.status !== 'SUCCEEDED') {
    throw new Error(`Top-up settlement failed (${settle.status}): ${JSON.stringify(result)}`);
  }
}

export async function payFromWallet(gatewayUrl, token, orderId, { timeoutMs = 10000 } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  const [orderResponse, walletResponse] = await Promise.all([
    fetch(`${gatewayUrl}/order/orders/${orderId}`, { headers }),
    fetch(`${gatewayUrl}/payment/wallet`, { headers }),
  ]);
  const orderData = (await json(orderResponse))?.result?.order;
  const balance = (await json(walletResponse))?.result?.balance;
  if (!orderResponse.ok || !walletResponse.ok || orderData?.totalAmount == null || balance == null) {
    throw new Error(`Could not load order or wallet (${orderResponse.status}/${walletResponse.status})`);
  }
  const shortfall = Number(orderData.totalAmount) - balance;
  if (shortfall > 0) await topUpFromMockGateway(gatewayUrl, token, Math.max(10000, shortfall));

  const paid = await fetch(`${gatewayUrl}/payment/wallet/orders/${orderId}/pay`, { method: 'POST', headers });
  const paidData = await json(paid);
  if (!paid.ok || !paidData?.result?.escrowAccountId) {
    throw new Error(`Wallet payment failed (${paid.status}): ${JSON.stringify(paidData)}`);
  }
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const res = await fetch(`${gatewayUrl}/order/orders/${orderId}`, { headers });
    last = (await json(res))?.result?.order ?? null;
    if (last?.orderStatus === 'CONFIRMED') return { escrow: paidData.result, order: last };
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
