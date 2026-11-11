const WEB_BASE = process.env.WORKGO_WEB_BASE || "http://localhost:3000";
const GATEWAY_BASE = process.env.WORKGO_GATEWAY_BASE || "http://localhost:8888";
const IDENTITY_BASE = process.env.WORKGO_IDENTITY_BASE || "http://localhost:8081";

const TIMEOUT_MS = 10000;

function truncate(text, max = 200) {
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

async function fetchRaw(url, init) {
  let res;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    const reason = err?.cause?.code || err?.message || String(err);
    throw new Error(`request to ${url} failed: ${reason}`);
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    res,
    text,
    json,
    contentType: res.headers.get("content-type") || "",
  };
}

async function assertHealth(base, path, label, hint) {
  let probe;
  try {
    probe = await fetchRaw(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "" }),
    });
  } catch (err) {
    throw new Error(`${label} failed: ${err.message}. ${hint}`);
  }
  const { res, json, text, contentType } = probe;

  const ok =
    res.status === 200 &&
    contentType.includes("application/json") &&
    json?.code === 1000 &&
    json?.result?.valid === false;

  if (!ok) {
    throw new Error(
      `${label} failed: HTTP ${res.status}, content-type "${contentType}", body "${truncate(text)}". ${hint}`
    );
  }

  console.log(`[PASS] ${label}`);
}

async function main() {
  await assertHealth(
    IDENTITY_BASE,
    "/identity/auth/introspect",
    "identity health",
    "identity-service is not running or is not answering with the expected JSON."
  );

  await assertHealth(
    GATEWAY_BASE,
    "/api/v1/identity/auth/introspect",
    "gateway health",
    "api-gateway is not running, or its identity route is misconfigured."
  );

  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const userName = `e2e_${suffix}`;
  const email = `${userName}@example.com`;
  const phone = `09${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
  const password = "Test@12345";
  const body = { firstName: "E2E", lastName: "Test", userName, password, email, phone };

  const register = await fetchRaw(`${WEB_BASE}/api/v1/identity/users/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (![200, 201, 202].includes(register.res.status)) {
    let hint = `registration failed: HTTP ${register.res.status}, body "${truncate(register.text)}".`;
    if (register.res.status === 404) {
      hint +=
        " Port 8081 may be held by another service; run .\\run.ps1 -Status and inspect the owner.";
    }
    throw new Error(hint);
  }
  if (register.json?.code !== 1000) {
    throw new Error(
      `registration returned code ${register.json?.code}: "${truncate(register.text)}".`
    );
  }
  if (register.json?.result?.userName !== userName) {
    throw new Error(
      `registration result.userName mismatch: expected "${userName}", body "${truncate(register.text)}".`
    );
  }
  console.log("[PASS] register via localhost:3000");

  const login = await fetchRaw(`${WEB_BASE}/api/v1/identity/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  });

  if (login.res.status !== 200 || typeof login.json?.result?.token !== "string" || !login.json.result.token) {
    throw new Error(
      `login failed: HTTP ${login.res.status}, body "${truncate(login.text)}".`
    );
  }
  console.log("[PASS] login with new account");
}

main().catch((err) => {
  console.error(`[FAIL] ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
