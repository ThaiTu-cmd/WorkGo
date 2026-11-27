# WorkGo — chạy toàn bộ hệ thống local bằng Docker

Mở Docker Desktop (Linux containers), PowerShell tại root WorkGo, rồi chạy:

```powershell
docker compose up -d --build --wait --wait-timeout 300
```

### Khởi động với database rỗng

Để reset toàn bộ dữ liệu local rồi build/up lại:

```powershell
docker compose down -v
docker compose up -d --build --wait --wait-timeout 300
```

`down -v` xóa cả volume database và file upload của WorkGo. Chỉ dùng để reset local khi chấp nhận xóa toàn bộ dữ liệu; không dùng để cập nhật hệ thống EC2 có dữ liệu cần giữ. Xóa container/image hoặc chạy `up --build` riêng không xóa dữ liệu trong volume.

Trên database mới, bootstrap mặc định tạo 4 dòng: 1 super admin trong `identity_db.users`, 1 quyền SUPER_ADMIN trong `roles`, 1 liên kết trong `user_role` và 1 chính sách phí trong `payment_db.fee_policy_versions`. Các bảng/collection khác ban đầu rỗng. Quyền CLIENT/PROVIDER/ADMIN chỉ được tạo khi thực sự cấp cho người dùng. Bootstrap phí chỉ tạo khi bảng chưa có chính sách: phiên bản 1, phí thành công 10%, phí hủy 2% với mức trần 100.000đ; không ghi đè chính sách đã tồn tại. Kiểm tra dữ liệu qua DBeaver/Compass hoặc công cụ database; không có bước kiểm đếm tự động trong lệnh Compose.

Lần đầu tải dependency và build image nên cần mạng và thời gian. Compose có 17 service: 6 PostgreSQL, MongoDB, một job tạo Mongo indexes, 7 backend owner, Gateway và web. Khi thành công, 16 container chạy/healthy; `mongo-init` kết thúc với exit0 là bình thường. Cần đủ RAM Docker cho toàn bộ stack; máy kiểm chứng trước đây có khoảng8GB dành cho Docker.

## Địa chỉ

| Thành phần | Địa chỉ/cổng trên máy |
|---|---|
| Website | http://localhost:3000/vi |
| Admin | http://localhost:3000/vi/admin |
| Gateway | http://localhost:8888/api/v1 |
| Identity / Catalog / Order / Payment / Job / Communication / Trust | `8081 / 8082 / 8083 / 8084 / 8085 / 8086 / 8087` |
| PostgreSQL theo thứ tự Identity / Catalog / Order / Payment / Job / Trust | `5433 / 5434 / 5435 / 5436 / 5437 / 5438` |
| MongoDB replica set | `27017`, `rs0`, kết nối host thêm `directConnection=true` |

Các cổng mặc định bind loopback. Backend liên lạc bằng DNS/cổng container, không qua các cổng host. Web proxy `/api/v1` tới Gateway. Compose không build/chạy frontend mobile hoặc Metro; app Android native chạy bằng Android Studio/emulator/điện thoại.

Emulator đặt `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8888/api/v1`; điện thoại USB dùng `adb reverse tcp:8888 tcp:8888` và API `http://127.0.0.1:8888/api/v1`. Khi backend lên AWS, app dùng `https://<api-domain>/api/v1` qua Internet, không cần container mobile. Xem phần [Android local và AWS](#android-local-va-aws) bên dưới.

## Dữ liệu và tài khoản local

Compose dùng project `workgo` và volume riêng, không dùng fixture39ed hoặc tự nhập dữ liệu từ stack cũ. Các volume `workgo_*` cũ được giữ nguyên. Database mới ban đầu có schema nhưng không tự seed dữ liệu demo, vì vậy danh sách nghiệp vụ có thể trống. Người dùng đăng ký và tạo dữ liệu qua API/UI.

Không cần `.env` cho bản local mặc định. Khi không bị `.env` ghi đè, ROOT bootstrap là `localroot`, mật khẩu `Local-root-password-27!`; tài khoản này có SUPER_ADMIN, không tự có ADMIN xử lý case. DB mặc định user `postgres`, password `admin123`. Đây là giá trị local, không dùng production. Có thể ghi đè qua `.env`/biến môi trường; giá trị mẫu hoặc trống trong `.env` có thể vô hiệu bootstrap hoặc làm cấu hình không hợp lệ.

Sáu PostgreSQL dùng chung mặc định `postgres/admin123` trong Compose, `.env.example` và cấu hình datasource của từng service. MongoDB giữ cấu hình hiện tại, không bật thêm xác thực. Mỗi service chỉ có một `src/main/resources/application.yml`: các profile `validated` và `prod` cần thiết được giữ bằng những khối YAML `---` trong cùng file; không cần `application-validated.yml` hoặc `application-prod.yml` riêng.

Đổi mật khẩu trong file không tự đổi mật khẩu đã lưu trên volume PostgreSQL cũ. Nếu dùng lại volume đã khởi tạo với mật khẩu khác, đổi mật khẩu role `postgres` trong database trước rồi cập nhật ứng dụng; không xóa volume để đổi mật khẩu.

Schema runtime đi kèm Git trong `docker/postgres-schema.sql` và `docker/mongo-indexes.js`, không chứa seed tài khoản/dữ liệu demo. Máy mới không cần `WorkGo.sql`, docs, test logs hay fixture của máy phát triển. Compose báo lỗi nếu file runtime thiếu, không tạo thư mục giả hoặc bỏ qua schema. Script PostgreSQL chỉ chạy `fresh` trên volume mới; Hibernate dùng `validate`, không tự sửa schema. Volume cũ lệch schema cần backup và migration được kiểm tra riêng; không xóa volume để chữa lỗi.

Khi sửa Entity, cập nhật trực tiếp `docker/postgres-schema.sql` và khi cần cập nhật collection/index thì sửa `docker/mongo-indexes.js`. Review và commit các thay đổi tương ứng cùng nhau; không thêm seed demo. Kiểm tra khởi tạo database mới và migration cho database đang có dữ liệu trước khi triển khai. Hibernate `validate` không tự cập nhật schema. `.gitattributes` giữ script/schema Docker ở LF khi clone trên Windows/Linux.

Mongo index initializer chạy replay-safe sau khi replica được bầu primary. File upload và signing key local ổn định qua restart; mỗi owner có volume file riêng. Gate Job accept/Trust decision execution vẫn đóng mặc định như source; mở cổng không có nghĩa hoàn thành mọi nghiệp vụ/phát hành. Compose không cấp merchant, OAuth, S3 hoặc bank simulator fixture; những luồng này cần cấu hình/tích hợp tương ứng. Không bật MOCK cho web mặc định.

## Cổng đã bị chiếm

Giữ cổng gốc của backend: Identity8081, Catalog8082, Order8083, Payment8084, Job8085, Communication8086, Trust8087 và Gateway8888; web3000. Compose không đổi cổng để né tiến trình khác. Metro native dùng18082 bên ngoài Docker.

Không chạy đồng thời bản local ngoài Docker trên cùng cổng. Nếu8081/3000 đang bị chiếm, dừng đúng bản local cũ trước khi khởi động Docker. Không tự kill tiến trình, không chuyển Identity sang18001 hay web sang13000. Kiểm tra và bỏ các biến ghi đè cổng cũ trong shell/`.env` nếu có.

## Kiểm tra và dừng

Nếu chỉ một phần container chạy, xem lỗi cuối trong terminal `docker compose up` và `docker compose ps -a`. Lỗi `bind ...8081... Only one usage` nghĩa là bản local khác đang chiếm cổng. Compose có thể ngắt việc khởi động các service khác, để chúng ở `Created` và chưa có log; không phải tất cả đều có lỗi ứng dụng. Sau khi dừng đúng server local cũ, chạy lại `docker compose up -d --wait --wait-timeout 300`; không cần build lại nếu source/image chưa đổi. `mongo-init` ở `Exited (0)` là hoàn thành bình thường; exit khác0 cần kiểm tra log.

```powershell
docker compose ps -a
docker compose logs --tail 100 api-gateway identity-service
docker compose stop
docker compose up -d --wait --wait-timeout 300
```

`docker compose down` bỏ container/network nhưng giữ volume. Không dùng `down -v` nếu cần giữ dữ liệu. Sau khi sửa source, chạy lại lệnh có `--build`.

## Khi lên AWS

Compose này dành cho local, không tự biến thành deployment production. Khi lên AWS, dùng domain HTTPS443 trỏ tới Gateway qua ALB/reverse proxy, service/DB trong mạng riêng; cấu hình secrets, storage, callback và rollout theo môi trường. Không mở mọi cổng database/service ra Internet. App native build với `EXPO_PUBLIC_API_BASE_URL=https://<api-domain>/api/v1`, `WORKGO_ALLOW_HTTP=0`, MOCK tắt. APK không cần Metro/USB. Xem phần [Android local và AWS](#android-local-va-aws) bên dưới. Việc bỏ các công cụ PowerShell/Python không ảnh hưởng runtime Docker; quy trình EC2 vẫn cần migration, backup và cấu hình production riêng.

Container names: `workgo-identity-service`, `workgo-api-gateway`, `workgo-web`, etc. Explicit names omit `local` and the replica suffix `-1`. Data volumes use explicit names such as `workgo-identity-pgdata`, separate from older `workgo_identity_pgdata` volumes.

## Android local va AWS

App ở `android-frontend` chạy bằng Android Emulator/điện thoại, không chạy trong Docker. Docker phục vụ database/backend/Gateway/web. Khi backend lên AWS, APK kết nối API HTTPS qua Internet, không cần container mobile hay máy lập trình.

### Chuẩn bị

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

### Local: emulator gọi Gateway trong Docker

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

### Local: điện thoại qua USB

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

### Backend đã deploy lên AWS

Backend cần có domain HTTPS và chứng chỉ hợp lệ, ví dụ `https://api-staging.example.com`. Domain chuyển tiếp `/api/v1` vào WorkGo Gateway; các microservice/DB dùng mạng nội bộ. Ví dụ bên dưới phải thay bằng domain thực:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = 'https://api-staging.example.com/api/v1'
$env:WORKGO_ALLOW_HTTP = '0'
$env:EXPO_PUBLIC_ENABLE_MOCK_PAYMENT = 'false'
npx.cmd expo run:android --device --port 18082
```

Backend AWS không cần `adb reverse` hay cùng Wi-Fi. Bản debug vẫn cần Metro trên máy phát triển; chỉ kết nối debug có thể dùng USB/LAN. App hiện suy ra chat URL `wss://api-staging.example.com/api/v1/communication/ws`; proxy/ALB và backend phải hỗ trợ đúng route/auth/WebSocket. File phải tải được qua HTTPS với quyền phù hợp, không trả URL localhost/IP private.

Cấu hình merchant, callback/IPN, OAuth redirect, S3/IAM và secrets thuộc backend AWS. Deploy lên AWS không tự chuyển endpoint sandbox/test thành thanh toán production. Return từ trình duyệt không thay receipt/ledger server. App có scheme `workgo` nhưng phải kiểm chứng flow deep link thực tế trước khi nhận đã hỗ trợ. Không đưa AWS/merchant/JWT signing secret vào `EXPO_PUBLIC_*`.

### APK độc lập và cập nhật

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

### Sử dụng và kiểm thử

CLIENT đăng nhập, khám phá dịch vụ/Job, đặt việc và theo dõi Order/input/progress. PROVIDER dùng tài khoản có quyền để nhận/xử lý công việc, giao bài/chứng cứ và xem uy tín/kháng nghị. Admin sử dụng web `/vi/admin`; không giả định mobile có mọi trang Admin. Đi theo trạng thái thật, không sửa balance/score/status trong DB để vượt điều kiện.

Trước khi nghiệm thu, kiểm tra login/logout/revoke, đổi tài khoản, camera/file/GPS và quyền từ chối, background/restart/offline/reconnect, hai client chat, API/file đúng quyền, receipt/retry không trùng giao dịch. Ghi thiết bị, Android version, build/API URL, expected/actual và bằng chứng đã che token. Cài được Android Studio hoặc build được APK chưa chứng minh các ca này đã đạt.

Kiểm tra logic tại `android-frontend`: `npm.cmd run test:unit`, `npm.cmd run typecheck`, `npm.cmd run lint`. Kiểm thử native vẫn cần emulator/thiết bị. Xem [hướng dẫn Docker](README.md) về dữ liệu và scope local.
