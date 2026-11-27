# Android WorkGo — local và backend trên AWS

App ở `android-frontend` chạy bằng Android Emulator/điện thoại, không chạy trong Docker. Docker phục vụ database/backend/Gateway/web. Khi backend lên AWS, APK kết nối API HTTPS qua Internet, không cần container mobile hay máy lập trình.

## Chuẩn bị

Cài Node/npm tương thích dependency của dự án, JDK (workspace dùng21), Android Studio, Android SDK Platform/Build-Tools, Platform-Tools và Emulator. Chọn SDK phù hợp với cấu hình Gradle mà Expo sinh; cài IDE đơn thuần chưa đủ. Trong Device Manager tạo và khởi động một thiết bị Android ảo.

PowerShell, nếu SDK nằm ở vị trí mặc định:

```powershell
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
java -version
node --version
adb devices
```

Nếu SDK ở nơi khác, lấy đường dẫn từ Android Studio. Trong `android-frontend`, chạy `npm.cmd ci` để cài dependency theo lockfile. Bản debug native được build bằng `expo run:android`; hướng dẫn không yêu cầu Expo Go hay thêm `expo-dev-client`.

## Local: emulator gọi Gateway trong Docker

Tại root, khởi động backend:

```powershell
docker compose up -d --build --wait --wait-timeout 300
```

Tại `android-frontend`, khi emulator đã mở:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:8888/api/v1'
$env:WORKGO_ALLOW_HTTP = '1'
$env:EXPO_PUBLIC_ENABLE_MOCK_PAYMENT = 'false'
npx.cmd expo run:android --port 18082
```

`10.0.2.2` là địa chỉ máy tính từ Android Emulator. Gateway giữ8888; Metro debug dùng18082 để không trùng các backend8081–8087. Giữ Metro chạy cho bản debug. Đăng ký CLIENT qua app/web; tài khoản fixture của máy cũ không tự có trong DB mới.

## Local: điện thoại qua USB

Bật Developer options/USB debugging, cắm USB, chấp nhận máy tính trên điện thoại. `adb devices` phải hiện trạng thái `device`. Nếu có nhiều thiết bị, dùng `adb -s <serial>` khi reverse và chọn thiết bị đúng trong CLI.

Tại `android-frontend`:

```powershell
adb reverse tcp:8888 tcp:8888
adb reverse tcp:18082 tcp:18082
$env:EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8888/api/v1'
$env:WORKGO_ALLOW_HTTP = '1'
$env:EXPO_PUBLIC_ENABLE_MOCK_PAYMENT = 'false'
npx.cmd expo run:android --device --port 18082
```

Nếu khởi động Metro riêng, dùng `npx.cmd expo start --localhost --port 18082` với cùng API URL. Kiểm tra `adb reverse --list`; có thể cần tạo lại sau khi rút USB/restart thiết bị. Khi dùng Wi-Fi, thay bằng IP LAN máy tính và chủ động cấu hình binding/firewall của Gateway; mặc định Compose bind loopback nên USB đơn giản hơn. Kiểm tra cả URL file/callback backend trả về, không chỉ API base.

## Backend đã deploy lên AWS

Backend cần có domain HTTPS và chứng chỉ hợp lệ, ví dụ `https://api-staging.example.com`. Domain chuyển tiếp `/api/v1` vào WorkGo Gateway; các microservice/DB dùng mạng nội bộ. Ví dụ bên dưới phải thay bằng domain thực:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = 'https://api-staging.example.com/api/v1'
$env:WORKGO_ALLOW_HTTP = '0'
$env:EXPO_PUBLIC_ENABLE_MOCK_PAYMENT = 'false'
npx.cmd expo run:android --device --port 18082
```

Backend AWS không cần `adb reverse` hay cùng Wi-Fi. Bản debug vẫn cần Metro trên máy phát triển; chỉ kết nối debug có thể dùng USB/LAN. App hiện suy ra chat URL `wss://api-staging.example.com/api/v1/communication/ws`; proxy/ALB và backend phải hỗ trợ đúng route/auth/WebSocket. File phải tải được qua HTTPS với quyền phù hợp, không trả URL localhost/IP private.

Cấu hình merchant, callback/IPN, OAuth redirect, S3/IAM và secrets thuộc backend AWS. Deploy lên AWS không tự chuyển endpoint sandbox/test thành thanh toán production. Return từ trình duyệt không thay receipt/ledger server. App có scheme `workgo` nhưng phải kiểm chứng flow deep link thực tế trước khi nhận đã hỗ trợ. Không đưa AWS/merchant/JWT signing secret vào `EXPO_PUBLIC_*`.

## APK độc lập và cập nhật

Chuẩn bị keystore theo mục “Tạo keystore” trong [README Android](../android-frontend/README.md). Script kiểm bốn thuộc tính `WORKGO_UPLOAD_*` trong Gradle user properties; giữ keystore/mật khẩu ngoài repo. Khi build cho AWS:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = 'https://api-staging.example.com/api/v1'
$env:WORKGO_ALLOW_HTTP = '0'
$env:EXPO_PUBLIC_ENABLE_MOCK_PAYMENT = 'false'
npm.cmd run build:apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

APK ở `android-frontend/android/app/build/outputs/apk/release/app-release.apk`. Kiểm API URL script in trước khi build. Script chạy `expo prebuild --clean`, sinh lại thư mục native; giữ các thay đổi native thủ công trước khi chạy.

Sau khi cài APK AWS, tắt Metro, rút USB và test bằng Wi-Fi/4G/5G. Khi chuyển production, đổi sang domain API production rồi build lại; URL được đưa vào bundle nên sửa `.env` trên server không tự đổi APK đã cài. Kiểm tra `.env.local`/`.env.production` để tránh giữ URL local hoặc bật HTTP/MOCK. App hiện có một package `com.workgo.app`, không tự cài song song staging/production. Giữ keystore, tăng versionCode/version theo kênh phân phối khi cập nhật và logout khi chuyển môi trường.

Nếu chỉ thay EC2/container nhưng giữ domain và API tương thích, thường không cần đổi APK. Nếu đổi domain/prefix hoặc contract/auth, cần kế hoạch tương thích cho app cũ. Hạ tầng AWS và các gate phát hành phải được kiểm chứng riêng.

## Sử dụng và kiểm thử

CLIENT đăng nhập, khám phá dịch vụ/Job, đặt việc và theo dõi Order/input/progress. PROVIDER dùng tài khoản có quyền để nhận/xử lý công việc, giao bài/chứng cứ và xem uy tín/kháng nghị. Admin sử dụng web `/vi/admin`; không giả định mobile có mọi trang Admin. Đi theo trạng thái thật, không sửa balance/score/status trong DB để vượt điều kiện.

Trước khi nghiệm thu, kiểm tra login/logout/revoke, đổi tài khoản, camera/file/GPS và quyền từ chối, background/restart/offline/reconnect, hai client chat, API/file đúng quyền, receipt/retry không trùng giao dịch. Ghi thiết bị, Android version, build/API URL, expected/actual và bằng chứng đã che token. Cài được Android Studio hoặc build được APK chưa chứng minh các ca này đã đạt.

Kiểm tra logic tại `android-frontend`: `npm.cmd run test:unit`, `npm.cmd run typecheck`, `npm.cmd run lint`. Kiểm thử native vẫn cần emulator/thiết bị. Xem [hướng dẫn Docker](README.md) về dữ liệu và scope local.
