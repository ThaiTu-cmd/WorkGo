-- 1. Xóa data cũ (tránh lỗi duplicate key khi khởi động lại ứng dụng nhiều lần)
DELETE FROM services;
DELETE FROM categories;

-- 2. Insert một số Category mẫu (Dùng UUID cứng để dễ map)
INSERT INTO categories (
    category_id, name, slug, description, created_at, is_deleted
) VALUES (
             '11111111-1111-1111-1111-111111111111',
             'Lập trình & Công nghệ',
             'lap-trinh-cong-nghe',
             'Các dịch vụ liên quan đến IT, website, app',
             CURRENT_TIMESTAMP,
             0
         );

INSERT INTO categories (
    category_id, name, slug, description, created_at, is_deleted
) VALUES (
             '22222222-2222-2222-2222-222222222222',
             'Thiết kế Đồ họa',
             'thiet-ke-do-hoa',
             'Thiết kế logo, banner, UI/UX',
             CURRENT_TIMESTAMP,
             0
         );

-- 3. Insert một số Service mẫu
-- provider_id: Là một UUID bất kỳ đóng vai trò ID của người cung cấp (lấy từ identity-service).
INSERT INTO services (
    service_id, title, slug, description, base_price, currency,
    execution_type, status, provider_id, category_id, is_deleted, created_at
) VALUES (
             '33333333-3333-3333-3333-333333333333',
             'Thiết kế Website Bán Hàng Trọn Gói',
             'thiet-ke-website-ban-hang-tron-goi',
             'Website chuẩn SEO, giao diện đẹp, tương thích mobile.',
             5000000,
             'VND',
             'DIGITAL',
             'PUBLISHED',
             '99999999-9999-9999-9999-999999999999', -- Giả lập 1 provider_id
             '11111111-1111-1111-1111-111111111111', -- Trỏ về Category "Lập trình"
             0,
             CURRENT_TIMESTAMP
         );