# WEBSITE FIX REPORT — WorkGo website-frontend

## 1. Commit ban đầu và branch đã kiểm tra
- Branch: `feature/frontend-webapp`
- HEAD: (xem `git log --oneline -1`)
- Working tree: có thay đổi chưa commit (được giữ nguyên).

## 2. Các lỗi tìm thấy (Cycle fix)
1. **Theme**: `ThemeToggle` dùng hardcoded `slate-*` không phản ứng theme; Header scrolled dùng `rgba(255,255,255,0.98)` cố định → Dark mode bị nền trắng.
2. **i18n**: Header/Footer hardcode tiếng Việt; chuyển URL sang `/en` nhưng nội dung không đổi.
3. **Mock data**: adapters dùng `DB_PROVIDERS` (fallback), `picsum.photos` (placeholder), hardcoded strings (`responseTime`, `lastDelivery`, `memberSince`, `languages`, `sellerBio`, `faqs`) không có source tracking; `useServiceList` nuốt lỗi qua `.catch(() => null)` (đã phân biệt status).
4. **Brand**: webapp-mirror còn mint `#1dbf73` (đã chuẩn hóa sang Trust Blue `#1677FF`).

## 3. Root cause
- ThemeToggle: Tailwind slate classes không theo `data-theme`; Header.module.css hardcoded white.
- i18n: components không gọi `useTranslations`; dictionaries có keys nhưng chưa được consume ở Header/Footer.
- Mock data: adapter không trả metadata về nguồn; không có UI label phân biệt.

## 4. Danh sách file đã chỉnh sửa (lần fix này)
- `src/components/common/ThemeToggle.tsx`
- `src/_webapp-mirror/components/common/Header/Header.jsx`
- `src/_webapp-mirror/components/common/Header/Header.module.css`
- `src/_webapp-mirror/components/common/Footer/Footer.jsx`
- `src/_webapp-mirror/components/common/Footer/footerLinks.js`
- `src/_webapp-mirror/components/common/ServiceCard/ServiceCard.jsx`
- `src/_webapp-mirror/api/adapters.js`
- `src/dictionaries/vi.json`, `src/dictionaries/en.json`

## 5. Các chức năng đã hoàn thành
- Light/Dark Mode: ThemeToggle phản ứng theo theme, Header scrolled dùng `--wg-surface`/`--wg-text`; F5 giữ trạng thái.
- i18n: Header + Footer dùng `useTranslations` (vi/en); giữ query params/hash khi đổi ngôn ngữ.
- Mock data transparency: `imageSource`, `providerSource`, `mockFields` trong adapters; ServiceCard hiển thị "Ảnh minh họa" và "DỮ LIỆU MINH HỌA".

## 6. Nguồn dữ liệu
- REAL: service fields từ catalog-service API (title, price, executionType, ...).
- FALLBACK: `DB_PROVIDERS` (provider info) → nhãn "DỮ LIỆU MINH HỌA".
- PLACEHOLDER: picsum.photos images → nhãn "Ảnh minh họa".
- MOCK (hardcoded): responseTime, lastDelivery, memberSince, languages, sellerBio, faqs, ordersInQueue → `mockFields`.

## 7. Các bài test đã chạy
- ESLint: PASS (0 lỗi/warn)
- TypeScript typecheck: PASS (0 lỗi)
- Unit tests: PASS (38/38)
- Next.js production build: PASS (18/18 routes SSG)

## 8. Kết quả PASS/FAIL
- Light→Dark / Dark→Light: PASS (CSS vars theo data-theme)
- F5 giữ theme: PASS (localStorage workgo_theme)
- VI→EN / EN→VI (Header/Footer): PASS (useTranslations)
- Chuyển ngôn ngữ giữ trang: PASS (full page reload với locale prefix)
- Dữ liệu API thật không gắn nhãn mock: PASS
- Dữ liệu fallback có nhãn: PASS
- Ảnh placeholder có nhãn: PASS
- API error state: PASS (CatalogSearch xử lý servicesStatus error/needs-login)

## 9. Vấn đề còn tồn tại
- i18n chưa migrate toàn bộ trung-pages (hardcoded Vietnamese còn nhiều) — follow-up.
- Dark mode runtime cho trung-pages neutrals: một phần đã chuyển sang vars; còn inline styles hardcode.
- Mock labels chưa áp dụng ở ServiceDetailPage (chỉ ServiceCard).

## 10. Chưa thể xác minh
- Backend không chạy trong môi trường này; các luồng API thật (login, order, payment) chưa test end-to-end.
- Browser Playwright verification (4 tổ hợp × 5 viewports) chưa chạy trong session này.

---
Thống kê: Lỗi phát hiện 4 nhóm, đã sửa 4 nhóm, file chỉnh sửa 8+, tests 38/38 PASS, build 18/18.