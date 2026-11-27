# WorkGo Android

App React Native (Expo SDK 57) cho khách hàng và chuyên gia WorkGo. App gọi thẳng API gateway của backend (`/api/v1`), không phụ thuộc web.

Hướng dẫn bàn giao hiện hành: [Android local với backend Docker và kết nối AWS](../docker/README.md#android-local-va-aws). Mobile chạy bằng Android Studio/emulator/điện thoại, không nằm trong Docker Compose.

## Cài đặt

```bash
npm install
```

Cần: Node 20+, JDK 17+ (máy dev đang dùng JDK 21), Android SDK (Android Studio). Nếu `ANDROID_HOME` chưa đặt, script build tự dùng `%LOCALAPPDATA%\Android\Sdk`.

## Chọn backend

URL backend được gắn vào app **lúc build**. Tạo `.env.local` (không commit) từ `.env.example`:

| Chạy trên | `EXPO_PUBLIC_API_BASE_URL` | `WORKGO_ALLOW_HTTP` |
|---|---|---|
| Emulator, backend trên laptop | `http://10.0.2.2:8888/api/v1` (mặc định) | `1` khi build APK release |
| Điện thoại chung Wi‑Fi | `http://<IP LAN của laptop>:8888/api/v1` | `1` khi build APK release |
| Điện thoại khác mạng | `https://<URL ngrok/cloudflared>/api/v1` | không đặt |
| Server đã deploy | `https://<domain>/api/v1` | không đặt |

- Bản dev (`npx expo run:android`) vốn cho phép HTTP; cờ `WORKGO_ALLOW_HTTP` chỉ ảnh hưởng APK release.
- APK dùng cho server HTTPS thật phải build **không** bật cờ này.

### Thanh toán

- Bản dev hiện thêm lựa chọn **Thanh toán thử nghiệm** (cổng `MOCK`): bấm "Giả lập thành công/thất bại" ngay trong app, không cần VNPay/MoMo. Cổng này chỉ có khi payment-service chạy profile `dev` (mặc định).
- APK release ẩn lựa chọn này; đặt `EXPO_PUBLIC_ENABLE_MOCK_PAYMENT=true` trong `.env.local` để bật lại (vd. APK demo với backend local), hoặc `false` để tắt trong bản dev.
- VNPay/MoMo mở trang thanh toán trong trình duyệt của app. Kết quả về qua IPN của cổng, nên app tự kiểm tra lại sau khi đóng trình duyệt (mỗi 3 giây, khoảng 2 phút). IPN chỉ tới được backend có URL công khai (ngrok/cloudflared hoặc server đã deploy).

### Test khi chưa deploy

1. Chạy backend trên laptop: `docker-compose up -d` (database) rồi `.\run.ps1` ở thư mục gốc repo (gateway cổng 8888).
2. Emulator: dùng URL mặc định `10.0.2.2`.
3. Điện thoại cùng Wi‑Fi: lấy IP LAN của laptop (`ipconfig`), mở cổng 8888 trên Windows Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "WorkGo gateway 8888" -Direction Inbound -Protocol TCP -LocalPort 8888 -Action Allow
   ```
4. Điện thoại khác mạng: `ngrok http 8888` hoặc `cloudflared tunnel --url http://localhost:8888`, dùng URL HTTPS nó in ra.
5. Admin duyệt hồ sơ chuyên gia: chạy web local (`npm run dev` trong `website-frontend`) hoặc gọi API duyệt bằng Postman collection trong repo.

## Chạy khi phát triển

```bash
npx expo run:android
```

Cài development build lên emulator (vd `Medium_Phone_API_36.1`) và bật Metro; sửa code là app cập nhật ngay.

```bash
npm test          # Jest
npm run typecheck
npm run lint
```

## Build APK release

### Tạo keystore (một lần)

```powershell
mkdir $env:USERPROFILE\.workgo
keytool -genkeypair -v -keystore $env:USERPROFILE\.workgo\workgo-release.jks -alias workgo -keyalg RSA -keysize 2048 -validity 10000
```

Thêm vào `%USERPROFILE%\.gradle\gradle.properties` (file này **không** nằm trong repo):

```properties
WORKGO_UPLOAD_STORE_FILE=C:/Users/<bạn>/.workgo/workgo-release.jks
WORKGO_UPLOAD_STORE_PASSWORD=<mật khẩu keystore>
WORKGO_UPLOAD_KEY_ALIAS=workgo
WORKGO_UPLOAD_KEY_PASSWORD=<mật khẩu key>
```

Giữ keystore và mật khẩu cẩn thận: mất keystore thì không cập nhật được APK đã cài (phải gỡ cài lại).

### Build

```bash
npm run build:apk
```

Script in ra URL backend và trạng thái HTTP trước khi build, rồi chạy `expo prebuild` + `gradlew assembleRelease`. Kết quả: `android/app/build/outputs/apk/release/app-release.apk`.

Cài lên emulator/điện thoại (bật USB debugging):

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Hoặc copy file APK sang điện thoại và mở để cài (cho phép "cài từ nguồn không xác định").

## Logo

`assets/brand/workgo-mark.svg` là nguồn; chạy `npm run icons` để xuất lại các PNG trong `assets/images/`.

## Checklist kiểm thử thủ công

1. Khách chưa đăng nhập: trang chủ, khám phá, tìm kiếm, chi tiết dịch vụ.
2. Đăng ký → đăng nhập → sửa thông tin → thêm/sửa/xoá địa chỉ.
3. Đặt một dịch vụ Tại nhà (chọn lịch + địa chỉ) và một dịch vụ Online; đơn hiện ở tab Đơn hàng.
4. Chi tiết đơn: trạng thái, lịch sử.
   - Đặt đơn với "Thanh toán thử nghiệm" → "Giả lập thành công" → đơn sang `CONFIRMED`, chi tiết đơn hiện thẻ Ký quỹ "Đang giữ tiền".
   - "Giả lập thất bại" → "Thử thanh toán lại"; đơn chờ thanh toán có nút "Thanh toán" trong chi tiết đơn.
5. Đăng ký chuyên gia → admin duyệt trên web → "Cập nhật quyền" → thấy "Dịch vụ của tôi".
6. Tạo dịch vụ có ảnh chụp từ camera, thêm khung giờ: các lượt trong 4 tuần tới hiện ngay ở "Lịch sắp tới" (backend tự sinh). Sửa khung giờ thì lượt trống được tạo lại, lượt đã đặt vẫn giữ.
7. Đưa đơn Tại nhà đến trạng thái cho phép bằng luồng API/UI đúng quyền, rồi chuyên gia gửi bằng chứng bằng camera; khách kiểm tra ảnh. Không sửa trực tiếp trạng thái database để thay nghiệm thu luồng.
8. Tắt mạng: hiện banner "Mất kết nối mạng", "Thử lại" hoạt động khi có mạng.
9. Để app chạy nền rồi mở lại: vẫn đăng nhập; token được làm mới khi còn dưới 2 giờ.

## Cấu trúc

```
src/app/       route expo-router (chỉ re-export màn hình)
src/features/  màn hình + hook theo nghiệp vụ: catalog, checkout, orders, payment, account, provider
src/api/       client fetch, module API, adapters, query keys
src/auth/      phiên đăng nhập (JWT trong SecureStore), refresh token
src/ui/        component dùng chung
src/lib/       env, format, xử lý ảnh
plugins/       config plugin ký APK release
```
