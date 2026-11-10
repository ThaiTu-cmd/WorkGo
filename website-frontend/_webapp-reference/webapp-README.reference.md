# WorkGo — Web Application (Frontend)

Giao diện Trang Chủ (Home Page) của sàn dịch vụ chuyên nghiệp **WorkGo**, xây dựng bằng **React 18 + Vite** lấy cảm hứng từ chuẩn mực thiết kế của **Fiverr**.

---

## 🌟 Điểm nổi bật giao diện

1. **Header thông minh**:
   - Logo thương hiệu WorkGo với biểu tượng màu xanh lá đặc trưng.
   - Hiệu ứng đổi màu nền sang trắng mờ khi cuộn trang (Sticky glassmorphism).
   - Thanh tìm kiếm mini tự động xuất hiện khi cuộn qua Hero Banner.
   - Điều hướng đầy đủ trên Desktop và Mobile Drawer tiện dụng.

2. **Search-First Hero Banner**:
   - Background gradient tối sang trọng (`#012b1d` → `#0b4e33`).
   - Thanh Search trung tâm tích hợp chọn hình thức thực hiện:
     - 🌐 Online / Digital
     - 🏠 Tại nhà / Onsite
     - 🚚 Giao nhận / Delivery
     - 📅 Đặt lịch hẹn / Appointment
   - Dãy từ khóa tìm kiếm thịnh hành: `#ThiếtKếLogo`, `#LậpTrìnhWebsite`, `#SửaĐiệnNước`, `#DọnDẹpNhà`, `#GiaoHàngHỏaTốc`.
   - 3 huy hiệu tín nhiệm: Ký quỹ Escrow, Chuyên gia kiểm duyệt, Báo giá 15 phút.

3. **Danh mục nổi bật (Featured Categories)**:
   - Đồng bộ từ kiến trúc WorkGo Ver 2 (`WorkGoArchitecture_ver2.md`).
   - 8 danh mục: Lập trình, Thiết kế, Sửa điện nước, Vệ sinh, Viết lách, Giao nhận, Marketing, Gia sư.
   - Tự động gọi API `catalog-service` (`/catalog/categories/roots`), kèm fallback mock data khi backend chưa khởi động.

4. **Dịch vụ phổ biến (Popular Services Carousel)**:
   - Thiết kế thẻ dịch vụ (Gig Card) phong cách Fiverr: Ảnh bìa 16:10, avatar chuyên gia, huy hiệu Verified, đánh giá sao, số review, giá khởi điểm "Từ ₫...".
   - Bộ lọc nhanh theo loại hình thực hiện.

5. **Giá trị cốt lõi (Value Proposition)**:
   - Cơ chế bảo chứng thanh toán **Ký quỹ (Escrow)**.
   - Minh bạch gói dịch vụ **Basic / Standard / Premium & Add-on**.
   - Linh hoạt 2 chiều: Mua dịch vụ niêm yết (Flow A) hoặc Đăng tin tìm thợ (Flow B).

6. **Quy trình 4 bước (How It Works)**:
   - Tìm kiếm / Đăng việc → Trao đổi & Chọn gói → Ký quỹ an toàn → Nghiệm thu & Giải ngân.

7. **Dual Call-to-Action (CTA)**:
   - Khối Đăng yêu cầu dành cho Khách hàng.
   - Khối Bán dịch vụ dành cho Chuyên gia / Freelancer.

8. **Auth Modal tích hợp**:
   - Hộp thoại Đăng nhập & Đăng ký tích hợp trực tiếp với `identity-service` qua API Gateway `/api/v1/identity/auth/token`.

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt thư viện:

```bash
cd "d:\Desktop\Workgo project\WorkGo\web-app"
npm install
```

### 2. Chạy môi trường phát triển (Dev Server):

```bash
npm run dev
```

Trang chủ sẽ mở tại: **`http://localhost:5173`**

### 3. Build sản phẩm (Production):

```bash
npm run build
```

---

## 🔌 Cổng kết nối hệ thống (Ports Mapping)

| Thành phần           | Cổng (Port) | Đường dẫn API          |
| -------------------- | ----------- | ---------------------- |
| **Web App (Vite)**   | `5173`      | Frontend               |
| **API Gateway**      | `8888`      | `/api/v1/...`          |
| **Identity Service** | `8081`      | `/api/v1/identity/...` |
| **Catalog Service**  | `8082`      | `/api/v1/catalog/...`  |
