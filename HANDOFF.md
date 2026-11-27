# WorkGo — bàn giao source và chạy trên máy mới

## Chạy local sau khi clone

Cần Git, Docker Desktop/Engine với Linux containers và Docker Compose v2 trở lên. Lần build đầu cần Internet để tải image, Maven và npm dependency. Dành đủ tài nguyên Docker cho sáu PostgreSQL, MongoDB, tám ứng dụng Java và Next.js; môi trường kiểm chứng trước đây dùng khoảng8GB RAM cho Docker.

Tại thư mục chứa `docker-compose.yml`:

```powershell
docker compose up -d --build --wait --wait-timeout 300
docker compose ps -a
```

Không cần mang theo `WorkGo.sql`, thư mục `docs`, test logs, database fixture, `node_modules` hay Maven `target` của máy cũ. Schema và Mongo indexes cần chạy đã được đưa vào `docker/`. Các thành phần này phải được commit cùng source, không chỉ riêng file Compose.

| Thành phần | Địa chỉ |
|---|---|
| Web | http://localhost:3000/vi |
| Admin | http://localhost:3000/vi/admin |
| Gateway | http://localhost:8888/api/v1 |
| Backend owners | Identity8081, Catalog8082, Order8083, Payment8084, Job8085, Communication8086, Trust8087 |
| Database | PostgreSQL5433–5438, Mongo27017 |

Kỳ vọng 16 container chạy/healthy và `workgo-mongo-init` kết thúc exit0. Không có container mobile; Android chạy bằng emulator/điện thoại. Nếu cổng gốc bị chiếm, dừng đúng server local cũ rồi chạy lại, không tự đổi cổng service.

## Tập file cần đưa lên GitHub

- Source backend và frontend, các `pom.xml`, `package.json`, lockfile và cấu hình build đang được Git theo dõi.
- `docker-compose.yml`, `.dockerignore`, `.gitattributes`.
- `docker/backend.Dockerfile`, `docker/web.Dockerfile`.
- `docker/init-postgres.sh`, `docker/postgres-schema.sql`.
- `docker/init-mongo.sh`, `docker/mongo-indexes.js`.
- `docker/export-schema.py` cho người bảo trì schema; máy chạy Docker không cần Python.
- `docker/README.md`, `docker/MOBILE.md`, `HANDOFF.md`.
- Bản sửa `job-service/.../entity/Application.java` trong cùng bộ source để JAR Job khởi động đúng mapping.

Không commit `.env`, secret/key thật, keystore Android, volume/dump database, object upload hoặc tài khoản/dữ liệu khách hàng. File SQL runtime chứa schema/migration, không có seed tài khoản demo. Quy tắc ignore cho tài liệu/test/fixture local và `WorkGo.sql` vẫn được giữ.

## Dữ liệu, tài khoản và phạm vi

Volume mới được khởi tạo schema, không nhập dữ liệu nghiệp vụ từ máy cũ. Giá trị local mặc định không cần `.env`: ROOT `localroot`, mật khẩu `Local-root-password-27!`; DB user `postgres`, mật khẩu `admin123`. ROOT chỉ có SUPER_ADMIN, không tự có ADMIN xử lý case. Đăng ký CLIENT và tạo dữ liệu bằng UI/API.

Nếu đã có `.env` từ lần chạy trước, kiểm tra các giá trị ghi đè, đặc biệt mật khẩu DB/JWT, bootstrap và port. Các giá trị mẫu chưa điền có thể làm đăng nhập hoặc startup thất bại. Mật khẩu DB phải khớp volume hiện hữu; thay env không tự đổi mật khẩu đã lưu trong PostgreSQL.

Đây là stack phát triển local. Gate Job accept/Trust decision execution giữ đóng mặc định. Merchant, Google OAuth/Meet, S3 và điều kiện phát hành cần cấu hình/nghiệm thu riêng; mở đủ cổng không xác nhận hoàn thành mọi luồng nghiệp vụ.

## Dừng, cập nhật và AWS

`docker compose stop` dừng container; `docker compose down` bỏ container/network, giữ dữ liệu volume. `down -v` xóa dữ liệu của stack, không dùng để cập nhật source. Script init PostgreSQL chỉ chạy trên volume mới. Cập nhật schema trên DB có dữ liệu phải backup, review migration và kiểm tra tương thích; không tự áp dụng fresh mode.

Chi tiết vận hành và các port: [docker/README.md](docker/README.md). Chạy mobile với backend Docker hoặc domain AWS HTTPS: [docker/MOBILE.md](docker/MOBILE.md).

Khi triển khai AWS, cấu hình TLS/domain, routing, secrets, private network, persistent storage và quy trình backup/rollout riêng. Không dùng mặc định local hoặc mở toàn bộ cổng DB ra Internet. Source bàn giao chạy được local không đồng nghĩa đã chuẩn bị/triển khai hạ tầng AWS production.
