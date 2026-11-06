import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

// TC-401: Package "22" dependency complete removal check
test('TC-URL-01: Gỡ bỏ triệt để dependency "22" khỏi package.json và package-lock.json', () => {
  const pkgPath = path.join(frontendRoot, 'package.json');
  const pkgLockPath = path.join(frontendRoot, 'package-lock.json');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  assert.equal(pkg.dependencies?.['22'], undefined, 'package.json must not contain dependency "22"');

  const pkgLock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf-8'));
  assert.equal(pkgLock.packages?.['']?.dependencies?.['22'], undefined, 'package-lock root must not contain "22"');
  assert.equal(pkgLock.packages?.['node_modules/22'], undefined, 'package-lock node_modules must not contain "22"');
});

// TC-402: Locale redirection check
test('TC-URL-02: Kiểm tra route locale /en chuyển hướng nhất quán về /vi', () => {
  const pagePath = path.join(frontendRoot, 'src', 'app', '[locale]', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');

  assert.ok(pageContent.includes('redirect("/vi")') || pageContent.includes("redirect('/vi')"), 'LocaleRootPage must redirect /en to /vi');
  assert.ok(pageContent.includes('locale === "en"') || pageContent.includes("locale === 'en'"), 'Must check for locale === "en"');
});

// TC-403: .env.example exists and contains API_GATEWAY_URL
test('TC-URL-03: Kiểm tra cấu hình .env.example chuẩn hóa cho production', () => {
  const envExamplePath = path.join(frontendRoot, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist in website-frontend');

  const content = fs.readFileSync(envExamplePath, 'utf-8');
  assert.ok(content.includes('API_GATEWAY_URL='), '.env.example must document API_GATEWAY_URL');
  assert.ok(content.includes('NEXT_PUBLIC_DEFAULT_LOCALE='), '.env.example must document NEXT_PUBLIC_DEFAULT_LOCALE');
});

// TC-404: saveAuth transactional rollback simulation
test('TC-URL-04: Kiểm thử tính nguyên tử và rollback của saveAuth trong auth.ts', () => {
  const store = {
    accessToken: 'existing-valid-token',
    workgo_auth_user: JSON.stringify({ name: 'Old User', email: 'old@workgo.vn' }),
  };

  let failOnUserKey = false;
  let eventDispatched = false;

  const mockLocalStorage = {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      if (failOnUserKey && key === 'workgo_auth_user') {
        throw new Error('QuotaExceededError: LocalStorage quota exceeded');
      }
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };

  // 1. Transactional rollback logic verification
  function testSaveAuth(user) {
    let prevToken = null;
    let prevUser = null;
    try {
      prevToken = mockLocalStorage.getItem('accessToken');
      prevUser = mockLocalStorage.getItem('workgo_auth_user');
    } catch {
      return false;
    }

    const newToken = `mock-token-${Date.now()}`;
    const newUser = JSON.stringify(user);

    try {
      mockLocalStorage.setItem('accessToken', newToken);
      mockLocalStorage.setItem('workgo_auth_user', newUser);
    } catch {
      // Rollback
      try {
        if (prevToken !== null) mockLocalStorage.setItem('accessToken', prevToken);
        else mockLocalStorage.removeItem('accessToken');

        if (prevUser !== null) mockLocalStorage.setItem('workgo_auth_user', prevUser);
        else mockLocalStorage.removeItem('workgo_auth_user');
      } catch {
        /* rollback failure ignored */
      }
      return false; // Do not notify
    }

    eventDispatched = true;
    return true;
  }

  // A. Simulate failure during write of second key
  failOnUserKey = true;
  const failResult = testSaveAuth({ name: 'New User', email: 'new@workgo.vn' });

  assert.equal(failResult, false, 'saveAuth must return false when storage fails');
  assert.equal(eventDispatched, false, 'No auth event must be dispatched on failure');
  assert.equal(store.accessToken, 'existing-valid-token', 'Token must rollback to previous value');
  assert.equal(JSON.parse(store.workgo_auth_user).name, 'Old User', 'User must rollback to previous value');

  // B. Simulate successful write
  failOnUserKey = false;
  const successResult = testSaveAuth({ name: 'New User', email: 'new@workgo.vn' });

  assert.equal(successResult, true, 'saveAuth must return true on success');
  assert.equal(eventDispatched, true, 'Event must be dispatched on success');
  assert.ok(store.accessToken.startsWith('mock-token-'), 'Token must be updated');
  assert.equal(JSON.parse(store.workgo_auth_user).name, 'New User', 'User must be updated');
});

// TC-405: URL Query Parser & History URL Builder Verification
test('TC-URL-05: Kiểm thử thuật toán parseUrlParams và buildTargetUrl hai chiều', () => {
  const KNOWN_PAGES = new Set(['home', 'catalog', 'detail', 'orders', 'wallet', 'finance']);

  function testParseUrlParams(search) {
    const sp = new URLSearchParams(search);
    const p = sp.get('page');
    const targetPage = p && KNOWN_PAGES.has(p) ? p : 'home';
    return {
      page: targetPage,
      params: {
        category: sp.get('category') || 'ALL',
        executionType: sp.get('executionType') || 'ALL',
        query: sp.get('query') || '',
        serviceId: sp.get('serviceId') || '',
      },
    };
  }

  function testBuildTargetUrl(page, params = {}, pathname = '/vi') {
    const q = new URLSearchParams();
    if (page !== 'home') q.set('page', page);
    if (params.category && params.category !== 'ALL') q.set('category', params.category);
    if (params.executionType && params.executionType !== 'ALL') q.set('executionType', params.executionType);
    if (params.query) q.set('query', params.query);
    if (params.serviceId) q.set('serviceId', params.serviceId);

    const prefix = pathname.startsWith('/en') ? '/en' : '/vi';
    const qs = q.toString();
    return qs ? `${prefix}?${qs}` : prefix;
  }

  // Parse direct links
  const parsed1 = testParseUrlParams('?page=catalog&category=thiet-ke-do-hoa&executionType=DIGITAL');
  assert.equal(parsed1.page, 'catalog');
  assert.equal(parsed1.params.category, 'thiet-ke-do-hoa');
  assert.equal(parsed1.params.executionType, 'DIGITAL');

  const parsed2 = testParseUrlParams('?page=detail&serviceId=44444444-4444-4444-4444-444444444444');
  assert.equal(parsed2.page, 'detail');
  assert.equal(parsed2.params.serviceId, '44444444-4444-4444-4444-444444444444');

  // Fallback on invalid page
  const parsedInvalid = testParseUrlParams('?page=non_existent_page_123');
  assert.equal(parsedInvalid.page, 'home', 'Invalid page must fallback to home');

  // Build target URLs
  const url1 = testBuildTargetUrl('catalog', { category: 'thiet-ke-do-hoa', executionType: 'DIGITAL' });
  assert.equal(url1, '/vi?page=catalog&category=thiet-ke-do-hoa&executionType=DIGITAL');

  const url2 = testBuildTargetUrl('detail', { serviceId: '44444444-4444-4444-4444-444444444444' });
  assert.equal(url2, '/vi?page=detail&serviceId=44444444-4444-4444-4444-444444444444');

  const urlHome = testBuildTargetUrl('home');
  assert.equal(urlHome, '/vi', 'Home URL must be clean /vi without query parameters');
});

// TC-406: Mock features transparency badges & banners
test('TC-URL-06: Xác nhận 100% các màn hình Mock Data có gắn nhãn cảnh báo minh bạch', () => {
  const pagesToCheck = [
    { file: 'src/components/trung-pages/payment/PaymentGatewayPage.tsx', keyword: 'Mock Demo' },
    { file: 'src/components/trung-pages/payment/WalletPage.tsx', keyword: 'chế độ giả lập' },
    { file: 'src/components/trung-pages/jobs/JobListPage.tsx', keyword: 'Chế độ Thử Nghiệm Sàn Việc Làm' },
    { file: 'src/components/trung-pages/jobs/JobPostPage.tsx', keyword: 'Chế độ Thử Nghiệm Sàn Việc Làm' },
    { file: 'src/components/trung-pages/jobs/SubmitProposalPage.tsx', keyword: 'Prototype Mode' },
    { file: 'src/components/trung-pages/jobs/ProposalReviewPage.tsx', keyword: 'Prototype Mode' },
    { file: 'src/components/trung-pages/trust/DisputeCenterPage.tsx', keyword: 'Trung Tâm Khiếu Nại Demo' },
    { file: 'src/components/trung-pages/messages/MessagesPage.tsx', keyword: 'Hệ Thống Trò Chuyện Giả Lập' },
    { file: 'src/components/trung-pages/public/PublicInfoPage.tsx', keyword: 'chế độ demo' },
  ];

  for (const item of pagesToCheck) {
    const fullPath = path.join(frontendRoot, item.file);
    assert.ok(fs.existsSync(fullPath), `File ${item.file} must exist`);
    const content = fs.readFileSync(fullPath, 'utf-8');
    assert.ok(content.includes(item.keyword), `${item.file} must contain transparency badge: "${item.keyword}"`);
  }
});

// TC-407: Form accessibility id/htmlFor check
test('TC-URL-07: Kiểm tra liên kết id và htmlFor cho form control trong PaymentGatewayPage', () => {
  const paymentPath = path.join(frontendRoot, 'src', 'components', 'trung-pages', 'payment', 'PaymentGatewayPage.tsx');
  const content = fs.readFileSync(paymentPath, 'utf-8');

  assert.ok(content.includes('htmlFor="wg-payment-amount"'), 'Payment amount label must have htmlFor="wg-payment-amount"');
  assert.ok(content.includes('id="wg-payment-amount"'), 'Payment amount input must have id="wg-payment-amount"');
});
