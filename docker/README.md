# WorkGo — chạy toàn bộ hệ thống local bằng Docker

Mở Docker Desktop (Linux containers), PowerShell tại root WorkGo, rồi chạy:

```powershell
docker compose up -d --build --wait --wait-timeout 300
```

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

Emulator đặt `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8888/api/v1`; điện thoại USB dùng `adb reverse tcp:8888 tcp:8888` và API `http://127.0.0.1:8888/api/v1`. Khi backend lên AWS, app dùng `https://<api-domain>/api/v1` qua Internet, không cần container mobile. Xem hướng dẫn local/AWS đi kèm source tại [MOBILE.md](MOBILE.md).

## Dữ liệu và tài khoản local

Compose dùng project `workgo` và volume riêng, không dùng fixture39ed hoặc tự nhập dữ liệu từ stack cũ. Các volume `workgo_*` cũ được giữ nguyên. Database mới ban đầu có schema nhưng không tự seed dữ liệu demo, vì vậy danh sách nghiệp vụ có thể trống. Người dùng đăng ký và tạo dữ liệu qua API/UI.

Không cần `.env` cho bản local mặc định. Khi không bị `.env` ghi đè, ROOT bootstrap là `localroot`, mật khẩu `Local-root-password-27!`; tài khoản này có SUPER_ADMIN, không tự có ADMIN xử lý case. DB mặc định user `postgres`, password `admin123`. Đây là giá trị local, không dùng production. Có thể ghi đè qua `.env`/biến môi trường; giá trị mẫu hoặc trống trong `.env` có thể vô hiệu bootstrap hoặc làm cấu hình không hợp lệ.

Sáu PostgreSQL dùng chung mặc định `postgres/admin123` trong Compose, `.env.example` và cấu hình datasource của từng service. MongoDB giữ cấu hình hiện tại, không bật thêm xác thực. Mỗi service chỉ có một `src/main/resources/application.yml`: các profile `validated` và `prod` cần thiết được giữ bằng những khối YAML `---` trong cùng file; không cần `application-validated.yml` hoặc `application-prod.yml` riêng.

Đổi mật khẩu trong file không tự đổi mật khẩu đã lưu trên volume PostgreSQL cũ. Nếu dùng lại volume đã khởi tạo với mật khẩu khác, đổi mật khẩu role `postgres` trong database trước rồi cập nhật ứng dụng; không xóa volume để đổi mật khẩu.

Schema runtime đi kèm Git trong `docker/postgres-schema.sql` và `docker/mongo-indexes.js`, không chứa seed tài khoản/dữ liệu demo. Máy mới không cần `WorkGo.sql`, docs, test logs hay fixture của máy phát triển. Compose báo lỗi nếu file runtime thiếu, không tạo thư mục giả hoặc bỏ qua schema. Script PostgreSQL chỉ chạy `fresh` trên volume mới; Hibernate dùng `validate`, không tự sửa schema. Volume cũ lệch schema cần backup và migration được kiểm tra riêng; không xóa volume để chữa lỗi.

Người bảo trì cập nhật schema canonical local có thể chạy `python docker/export-schema.py` tại root để xuất lại hai file runtime, rồi review diff và commit cùng thay đổi Entity. Python và canonical `WorkGo.sql` chỉ cần cho bước bảo trì này, không cần để người nhận chạy Docker. Các khối seed demo được loại khỏi bản xuất; migration/backfill cần thiết được giữ lại. `.gitattributes` giữ script/schema Docker ở LF khi clone trên Windows/Linux.

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

Compose này dành cho local, không tự biến thành deployment production. Khi lên AWS, dùng domain HTTPS443 trỏ tới Gateway qua ALB/reverse proxy, service/DB trong mạng riêng; cấu hình secrets, storage, callback và rollout theo môi trường. Không mở mọi cổng database/service ra Internet. App native build với `EXPO_PUBLIC_API_BASE_URL=https://<api-domain>/api/v1`, `WORKGO_ALLOW_HTTP=0`, MOCK tắt. APK không cần Metro/USB. Xem các bước staging/production trong [MOBILE.md](MOBILE.md).

Container names: `workgo-identity-service`, `workgo-api-gateway`, `workgo-web`, etc. Explicit names omit `local` and the replica suffix `-1`. Data volumes use explicit names such as `workgo-identity-pgdata`, separate from older `workgo_identity_pgdata` volumes.
