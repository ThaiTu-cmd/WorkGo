import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, "../../");
const W = path.join(REPO, "website-frontend");
const TRUNG = path.join(W, "src/components/trung-pages");
const SHELL = path.join(W, "src/components/webapp-bridge/webapp-shell.tsx");

const read = (p) => fs.readFileSync(p, "utf-8");

test("payout requests use the supported backend contract and keep the retry key after a lost response", async () => {
  const calls = [];
  let walletCalls = 0;
  const screen = loadPayoutPage({
    getPayouts: async () => ({ result: [] }),
    getWallet: async () => ({ result: { balance: ++walletCalls === 1 ? 150000 : 100000, outstandingFee: 0 } }),
    requestPayout: async (body, key) => {
      calls.push({ body, key });
      if (calls.length === 1) throw new Error("Connection lost");
      return { result: { payoutId: "p1", status: "REQUESTED" } };
    },
  });
  await screen.ready();
  screen.change("bankCode", "VCB");
  screen.change("accountName", "NGUYEN VAN A");
  screen.change("accountNumber", "0071001234567");
  screen.change("amount", "50000");
  await screen.submit();
  await screen.submit();
  assert.equal(calls.length, 2);
  assert.deepEqual({ ...calls[0].body }, {
    amount: 50000, bankCode: "VCB", accountName: "NGUYEN VAN A", accountNumber: "0071001234567",
  });
  assert.ok(calls[0].key);
  assert.equal(calls[0].key, calls[1].key);
  assert.equal(walletCalls, 2);
  assert.equal(screen.text().includes("100,000"), true);
  assert.equal(screen.toasts.length, 1);
  const source = read(path.join(TRUNG, "payment/PayoutSettingsPage.tsx"));
  assert.doesNotMatch(source, /(?:get|save)PayoutSettings|localStorage/);
});

test("payout amount validation accepts 50k and rejects the daily limit, debt and insufficient funds", () => {
  const screen = loadPayoutPage({});
  const t = key => key;
  assert.equal(screen.exports.validatePayoutAmount(50000, 50000, 0, t), undefined);
  assert.equal(screen.exports.validatePayoutAmount(49999, 50000, 0, t), "minimum");
  assert.equal(screen.exports.validatePayoutAmount(5000001, 6000000, 0, t), "dailyLimit");
  assert.equal(screen.exports.validatePayoutAmount(100000, 50000, 0, t), "insufficient");
  assert.equal(screen.exports.validatePayoutAmount(50000, 100000, 1, t), "hasDebt");
});

test("an ambiguous payout retry can recover its receipt after the server already held the funds", async () => {
  let wallets = 0;
  const calls = [];
  const screen = loadPayoutPage({
    getWallet: async () => ({ result: { balance: ++wallets === 1 ? 150000 : 50000, outstandingFee: 0 } }),
    requestPayout: async (body, key) => {
      calls.push({ body, key });
      if (calls.length === 1) throw new Error("Lost acknowledgment");
      return { result: { payoutId: "p1" } };
    },
  });
  await screen.ready();
  screen.change("bankCode", "VCB");
  screen.change("accountName", "NGUYEN VAN A");
  screen.change("accountNumber", "0071001234567");
  screen.change("amount", "100000");
  await screen.submit();
  await screen.refreshSession("refreshed-same-user-token");
  await screen.submit();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].key, calls[1].key);
});

test("a second payout click during the same request cannot create a second withdrawal", async () => {
  const calls = [];
  let finish;
  const screen = loadPayoutPage({
    getWallet: async () => ({ result: { balance: 150000, outstandingFee: 0 } }),
    getPayouts: async () => ({ result: [{ bankCode: "VCB", accountName: "SERVER USER", accountNumber: "0071001234567" }] }),
    requestPayout: async (body) => {
      calls.push(body);
      return new Promise(resolve => { finish = resolve; });
    },
  });
  await screen.ready();
  screen.change("amount", "50000");
  const first = screen.submit();
  await screen.submit();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].accountName, "SERVER USER");
  finish({ result: { payoutId: "p1" } });
  await first;
  assert.equal(screen.toasts.length, 1);
});

function loadPayoutPage(paymentApi) {
  const require = createRequire(import.meta.url);
  const dictionaries = JSON.parse(read(path.join(W, "src/dictionaries/en.json")));
  const hookState = [];
  let hookIndex = 0;
  const effects = [];
  let authToken = "user-token";
  const jsx = (type, props) => ({ type, props });
  const hooks = {
    useState: initial => {
      const index = hookIndex++;
      if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial;
      return [hookState[index], value => { hookState[index] = typeof value === "function" ? value(hookState[index]) : value; }];
    },
    useRef: initial => {
      const index = hookIndex++;
      return hookState[index] ?? (hookState[index] = { current: initial });
    },
    useEffect: (effect, deps) => {
      const index = hookIndex++;
      if (!hookState[index] || deps.some((dep, i) => dep !== hookState[index][i])) {
        hookState[index] = deps;
        effects.push(effect);
      }
    },
  };
  const exports = {};
  const translators = new Map();
  const mockedRequire = name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "next-intl") return {
      useLocale: () => "en",
      useTranslations: namespace => {
        if (!translators.has(namespace)) translators.set(namespace, (key, params = {}) => dictionaries[namespace]?.[key]?.replace(/\{(\w+)\}/g, (_, name) => params[name]) ?? key);
        return translators.get(namespace);
      },
    };
    if (name.endsWith("webapp-bridge/backend")) return { paymentApi: {
      getWallet: async () => ({ result: { balance: 0, outstandingFee: 0 } }),
      getPayouts: async () => ({ result: [] }),
      ...paymentApi,
    }, useAuthToken: () => authToken };
    if (name.endsWith(".css")) return { default: {} };
    if (name === "../_stores/keys") return { KEYS: {} };
    return require(name);
  };
  const compiled = ts.transpileModule(read(path.join(TRUNG, "payment/PayoutSettingsPage.tsx")), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require: mockedRequire, crypto: globalThis.crypto, Intl });
  let tree;
  const toasts = [];
  function render() {
    hookIndex = 0;
    tree = exports.default({ onNavigate: () => {}, onShowToast: message => toasts.push(message) });
    effects.splice(0).forEach(effect => effect());
  }
  function elements(node) {
    if (Array.isArray(node)) return node.flatMap(element => elements(element));
    if (!node || typeof node !== "object") return [];
    return [node, ...elements(node.props?.children)];
  }
  render();
  return {
    exports, toasts,
    ready: async () => { await new Promise(setImmediate); render(); },
    refreshSession: async (token) => {
      authToken = token;
      render();
      await new Promise(setImmediate);
      render();
    },
    change: (name, value) => {
      const input = elements(tree).find(node => node.type === "input" && node.props.name === name);
      assert.ok(input, "Missing input " + name);
      input.props.onChange({ target: { value } });
      render();
    },
    submit: async () => {
      const form = elements(tree).find(node => node.type === "form");
      await form.props.onSubmit({ preventDefault() {} });
      render();
    },
    text: () => JSON.stringify(tree),
  };
}

const ROUTES = [
  "register",
  "login",
  "profile-settings",
  "provider-onboarding",
  "address-book",
  "provider-profile",
  "job-list",
  "job-post",
  "submit-proposal",
  "proposal-review",
  "payment-gateway",
  "wallet",
  "payout-settings",
  "review-form",
  "dispute-center",
];

const PAGES = [
  "auth/RegisterPage.tsx",
  "auth/LoginPage.tsx",
  "profile/ProfileSettingsPage.tsx",
  "profile/AddressBookPage.tsx",
  "provider/ProviderOnboardingPage.tsx",
  "provider/ProviderProfilePage.tsx",
  "jobs/JobListPage.tsx",
  "jobs/JobPostPage.tsx",
  "jobs/SubmitProposalPage.tsx",
  "jobs/ProposalReviewPage.tsx",
  "payment/PaymentGatewayPage.tsx",
  "payment/WalletPage.tsx",
  "payment/PayoutSettingsPage.tsx",
  "trust/ReviewFormPage.tsx",
  "trust/DisputeCenterPage.tsx",
];

test("trung-pages: all 15 page components + css modules exist", () => {
  for (const p of PAGES) {
    assert.ok(fs.existsSync(path.join(TRUNG, p)), `missing ${p}`);
    const css = p.replace(/\.tsx$/, ".module.css");
    assert.ok(fs.existsSync(path.join(TRUNG, css)), `missing ${css}`);
  }
});

test("trung-pages: shell union carries all 15 routes + jobId/providerId/orderId params", () => {
  const shell = read(SHELL);
  const hasRoute = (r) => shell.includes(`'${r}'`) || shell.includes(`"${r}"`);
  const hasBranch = (r) => shell.includes(`currentPage === '${r}'`) || shell.includes(`currentPage === "${r}"`);
  for (const r of ROUTES) {
    assert.ok(hasRoute(r), `union missing '${r}'`);
    assert.ok(hasBranch(r), `render branch missing '${r}'`);
  }
  assert.ok(shell.includes("jobId?:"), "CatalogFilterParams missing jobId");
  assert.ok(shell.includes("providerId?:"), "CatalogFilterParams missing providerId");
  assert.ok(shell.includes("orderId?:"), "CatalogFilterParams missing orderId");
});

test("trung-pages: TrungSubNav links to all 15 routes", () => {
  const nav = read(path.join(TRUNG, "_ui/TrungSubNav.tsx"));
  for (const r of ROUTES) {
    assert.ok(nav.includes(r), `TrungSubNav missing '${r}'`);
  }
});

test("trung-pages: localStorage keys use workgo_* namespace", () => {
  const keys = read(path.join(TRUNG, "_stores/keys.ts"));
  for (const k of [
    "workgo_jobs",
    "workgo_proposals",
    "workgo_wallet",
    "workgo_disputes",
    "workgo_addresses",
    "workgo_profile",
    "workgo_payout",
    "workgo_provider_request",
    "accessToken",
  ]) {
    assert.ok(keys.includes(k), `keys.ts missing '${k}'`);
  }
});

test("trung-pages: no reverse import from _webapp-mirror in new pages", () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && read(p).includes("_webapp-mirror")) hits.push(path.relative(REPO, p));
    }
  };
  walk(TRUNG);
  assert.deepEqual(hits, [], `mirror imports found: ${hits.join(", ")}`);
});

test("trung-pages: no console.* in new pages", () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && /console\.(log|warn|error)\(/.test(read(p)))
        hits.push(path.relative(REPO, p));
    }
  };
  walk(TRUNG);
  assert.deepEqual(hits, [], `console noise found: ${hits.join(", ")}`);
});

test("trung-pages: vietnamese validation messages present", () => {
  const all = PAGES.map((p) => read(path.join(TRUNG, p))).join("\n")
    + read(path.join(TRUNG, "auth/authValidation.ts"));
  for (const msg of [
    "Email chưa đúng định dạng!",
    "Mật khẩu tối thiểu 6 ký tự!",
    "Số điện thoại phải 10 số, bắt đầu bằng 0!",
    "Giá tối thiểu là",
    "Bộ nhớ trình duyệt bị đầy",
  ]) {
    assert.ok(all.includes(msg), `message missing: ${msg}`);
  }
});

test("trung-pages: job types are defined by the Job domain contract, not mock data", () => {
  const types = read(path.join(TRUNG, "jobs/types.ts"));
  for (const t of ["DIGITAL", "ONSITE", "DELIVERY", "APPOINTMENT"]) {
    assert.ok(types.includes(t), `Job domain contract missing type ${t}`);
  }
});

test("trung-pages: legacy mock data sets are removed from business flow", () => {
  for (const m of [
    "mockJobs.ts",
    "mockProposals.ts",
  ]) {
    assert.ok(!fs.existsSync(path.join(TRUNG, "_mocks", m)), `legacy mock file should be removed: ${m}`);
  }

  // Profile, addresses, provider profile, wallet, payout, disputes, and reviews come from backend services now.
  for (const gone of [
    "mockProviders.ts",
    "mockAddresses.ts",
    "mockProfile.ts",
    "mockWallet.ts",
    "mockPayout.ts",
    "mockDisputes.ts",
    "mockReviews.ts",
  ]) {
    assert.ok(!fs.existsSync(path.join(TRUNG, "_mocks", gone)), `${gone} must be removed`);
  }
});

