DELETE FROM booking_slots;
DELETE FROM available_rules;
DELETE FROM service_medias;
DELETE FROM add_ons;
DELETE FROM packages;
DELETE FROM services;
DELETE FROM categories;

-- Providers come from identity-service (provider_profiles):
--   99999999-... = Văn A Studio, 88888888-... = B Media

-- ==========================================================
-- Categories (8 root categories, one per frontend icon group)
-- ==========================================================
INSERT INTO categories (category_id, name, slug, description, created_at, created_by, is_deleted)
VALUES ('11111111-1111-1111-1111-111111111111', 'Thiết kế Đồ họa', 'thiet-ke-do-hoa', 'Các dịch vụ thiết kế logo, banner, UI/UX', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-222222222222', 'Lập trình & IT', 'lap-trinh-it', 'Xây dựng website, app mobile, phần mềm', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-333333333333', 'Viết lách & Dịch thuật', 'viet-lach-dich-thuat', 'Sáng tạo nội dung, SEO, dịch thuật', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-444444444444', 'Marketing & Quảng cáo', 'marketing-quang-cao', 'Quảng cáo Facebook, Google, quản lý fanpage', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-555555555555', 'Sửa chữa & Bảo trì', 'sua-chua-bao-tri', 'Sửa điện nước, điện lạnh, thiết bị gia dụng tại nhà', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-666666666666', 'Vệ sinh & Dọn dẹp', 've-sinh-don-dep', 'Dọn dẹp nhà cửa, giặt sofa, vệ sinh văn phòng', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-777777777777', 'Vận chuyển & Giao hàng', 'van-chuyen-giao-hang', 'Giao hàng hỏa tốc, chuyển nhà, chuyển văn phòng', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-888888888888', 'Giáo dục & Gia sư', 'giao-duc-gia-su', 'Gia sư tại nhà, dạy kèm online, luyện thi', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0);

-- ==========================================================
-- Services (20, at least 2 per category)
-- ==========================================================
INSERT INTO services (service_id, title, slug, description, base_price, currency, execution_type, status, provider_id, created_at, published_at, is_deleted, category_id, avg_rating, review_count, order_count)
VALUES
-- Thiết kế Đồ họa
('44444444-4444-4444-4444-444444444444', 'Thiết kế Logo Doanh Nghiệp', 'thiet-ke-logo-doanh-nghiep', 'Thiết kế logo chuyên nghiệp, hiện đại, phù hợp nhận diện thương hiệu của doanh nghiệp.', 1000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-111111111111', 4.9, 58, 112),
('a0000000-0000-0000-0000-000000000001', 'Thiết kế UI/UX Figma cho App & Web', 'thiet-ke-ui-ux-figma', 'Thiết kế giao diện người dùng trên Figma: wireframe, prototype, design system bàn giao cho lập trình viên.', 4000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-111111111111', 4.8, 34, 61),
('a0000000-0000-0000-0000-000000000002', 'Thiết kế Banner & Ấn phẩm Mạng xã hội', 'thiet-ke-banner-mang-xa-hoi', 'Bộ banner, ảnh bìa, post Facebook/Instagram đồng bộ màu sắc thương hiệu.', 500000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-111111111111', 4.7, 76, 140),
-- Lập trình & IT
('55555555-5555-5555-5555-555555555555', 'Lập trình Landing Page', 'lap-trinh-landing-page', 'Xây dựng Landing Page tối ưu chuyển đổi, chuẩn SEO, tốc độ tải nhanh.', 3000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-222222222222', 4.8, 41, 87),
('a0000000-0000-0000-0000-000000000003', 'Lập trình Website Bán hàng', 'lap-trinh-website-ban-hang', 'Website bán hàng đầy đủ giỏ hàng, thanh toán online, quản lý đơn và kho.', 12000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-222222222222', 4.9, 22, 35),
('a0000000-0000-0000-0000-000000000004', 'Phát triển App Mobile React Native', 'phat-trien-app-mobile-react-native', 'Ứng dụng di động đa nền tảng iOS và Android bằng React Native, hỗ trợ đưa app lên store.', 25000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-222222222222', 4.6, 9, 14),
-- Viết lách & Dịch thuật
('66666666-6666-6666-6666-666666666666', 'Viết 10 bài chuẩn SEO', 'viet-10-bai-chuan-seo', 'Gói 10 bài viết 1000 chữ chuẩn SEO, nghiên cứu từ khóa, không đạo văn.', 2500000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-333333333333', 4.7, 63, 98),
('a0000000-0000-0000-0000-000000000005', 'Dịch thuật Anh - Việt chuyên ngành', 'dich-thuat-anh-viet', 'Dịch tài liệu kỹ thuật, hợp đồng, website Anh - Việt bởi biên dịch viên có chứng chỉ.', 300000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-333333333333', 4.8, 47, 120),
-- Marketing & Quảng cáo
('a0000000-0000-0000-0000-000000000006', 'Chạy Quảng cáo Facebook Ads', 'chay-quang-cao-facebook-ads', 'Lên chiến dịch, target khách hàng, tối ưu ngân sách và báo cáo hiệu quả hằng tuần.', 3500000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-444444444444', 4.6, 31, 55),
('a0000000-0000-0000-0000-000000000007', 'Quản lý Fanpage trọn gói', 'quan-ly-fanpage-tron-goi', 'Lên lịch nội dung, thiết kế bài đăng và trả lời tin nhắn fanpage hằng tháng.', 5000000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-444444444444', 4.5, 18, 26),
-- Sửa chữa & Bảo trì
('a0000000-0000-0000-0000-000000000008', 'Sửa điện nước tại nhà', 'sua-dien-nuoc-tai-nha', 'Sửa chập điện, thay ổ cắm, xử lý rò rỉ đường ống nước, thông tắc bồn rửa.', 250000, 'VND', 'ONSITE', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-555555555555', 4.8, 92, 210),
('a0000000-0000-0000-0000-000000000009', 'Vệ sinh & Bảo dưỡng Máy lạnh', 've-sinh-bao-duong-may-lanh', 'Vệ sinh dàn nóng dàn lạnh, kiểm tra gas, bảo dưỡng định kỳ máy lạnh treo tường.', 200000, 'VND', 'ONSITE', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-555555555555', 4.7, 120, 305),
('a0000000-0000-0000-0000-000000000010', 'Sửa máy giặt, tủ lạnh tại nhà', 'sua-may-giat-tu-lanh', 'Kiểm tra và sửa lỗi máy giặt, tủ lạnh các hãng, thay linh kiện chính hãng.', 300000, 'VND', 'ONSITE', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-555555555555', 4.5, 37, 66),
-- Vệ sinh & Dọn dẹp
('a0000000-0000-0000-0000-000000000011', 'Dọn dẹp nhà theo giờ', 'don-dep-nha-theo-gio', 'Nhân viên dọn dẹp nhà cửa, lau sàn, vệ sinh bếp và nhà tắm theo giờ.', 180000, 'VND', 'ONSITE', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-666666666666', 4.8, 150, 420),
('a0000000-0000-0000-0000-000000000012', 'Giặt Sofa, Nệm, Rèm tại nhà', 'giat-sofa-nem-rem', 'Giặt hơi nước nóng, hút bụi, khử mùi sofa, nệm và rèm cửa ngay tại nhà.', 400000, 'VND', 'ONSITE', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-666666666666', 4.6, 44, 79),
('a0000000-0000-0000-0000-000000000013', 'Tổng vệ sinh sau xây dựng', 'tong-ve-sinh-sau-xay-dung', 'Làm sạch bụi xi măng, sơn, kính và sàn sau khi xây dựng hoặc sửa chữa nhà.', 2000000, 'VND', 'ONSITE', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-666666666666', 4.7, 21, 33),
-- Vận chuyển & Giao hàng
('a0000000-0000-0000-0000-000000000014', 'Giao hàng hỏa tốc nội thành', 'giao-hang-hoa-toc-noi-thanh', 'Giao tài liệu, hàng hóa trong nội thành dưới 2 giờ, theo dõi hành trình trực tiếp.', 50000, 'VND', 'ONSITE', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-777777777777', 4.6, 230, 860),
('a0000000-0000-0000-0000-000000000015', 'Chuyển nhà trọn gói', 'chuyen-nha-tron-goi', 'Đóng gói, tháo lắp đồ đạc, vận chuyển và sắp xếp lại tại nhà mới.', 1500000, 'VND', 'ONSITE', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-777777777777', 4.7, 64, 102),
-- Giáo dục & Gia sư
('a0000000-0000-0000-0000-000000000016', 'Gia sư Toán THCS - THPT tại nhà', 'gia-su-toan-tai-nha', 'Gia sư Toán kèm 1-1 tại nhà, bám sát chương trình và luyện thi vào lớp 10, đại học.', 250000, 'VND', 'ONSITE', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-888888888888', 4.9, 27, 48),
('a0000000-0000-0000-0000-000000000017', 'Luyện IELTS Online 1 kèm 1', 'luyen-ielts-online-1-kem-1', 'Lộ trình IELTS cá nhân hóa qua Google Meet, chữa bài Writing và Speaking chi tiết.', 350000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-888888888888', 4.8, 39, 71);

-- ==========================================================
-- Packages: hand-written for the logo service, 3 tiers for the rest
-- (DIGITAL tiers vary delivery days, ONSITE tiers vary duration)
-- ==========================================================
INSERT INTO packages (package_id, name, description, price, currency, delivery_days, duration_minute, revision_limit, package_status, created_at, is_deleted, service_id)
VALUES ('66666666-6666-6666-6666-111111111111', 'Gói Cơ Bản', 'Thiết kế 1 concept logo, bàn giao JPG', 1000000, 'VND', 3, 0, 1, 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('66666666-6666-6666-6666-222222222222', 'Gói Tiêu Chuẩn', 'Thiết kế 2 concept, bàn giao Vector', 2000000, 'VND', 5, 0, 3, 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('66666666-6666-6666-6666-333333333333', 'Gói Cao Cấp', 'Thiết kế 3 concept, bàn giao Vector + Brand Guideline', 5000000, 'VND', 7, 0, 5, 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444');

INSERT INTO packages (package_id, name, description, price, currency, delivery_days, duration_minute, revision_limit, package_status, created_at, is_deleted, service_id)
SELECT md5(s.service_id::text || t.name)::uuid,
       t.name,
       CASE WHEN s.execution_type = 'DIGITAL' THEN t.digital_desc ELSE t.onsite_desc END,
       ROUND(s.base_price * t.price_factor, -3),
       'VND',
       CASE WHEN s.execution_type = 'DIGITAL' THEN t.delivery_days ELSE 0 END,
       CASE WHEN s.execution_type = 'ONSITE' THEN t.duration_minute ELSE 0 END,
       t.revision_limit,
       'ACTIVE', CURRENT_TIMESTAMP, 0, s.service_id
FROM services s
CROSS JOIN (VALUES
    ('Gói Cơ Bản',     1.0, 3,  60, 1, 'Phạm vi cơ bản, đáp ứng nhu cầu thiết yếu',          'Thời lượng 1 giờ, xử lý hạng mục cơ bản'),
    ('Gói Tiêu Chuẩn', 1.8, 5, 120, 3, 'Phạm vi mở rộng, thêm chỉnh sửa và hỗ trợ sau bàn giao', 'Thời lượng 2 giờ, kiểm tra tổng thể'),
    ('Gói Cao Cấp',    3.0, 7, 240, 5, 'Trọn gói, ưu tiên xử lý và hỗ trợ dài hạn',          'Thời lượng 4 giờ, đội 2 người, bảo hành dài hạn')
) AS t(name, price_factor, delivery_days, duration_minute, revision_limit, digital_desc, onsite_desc)
WHERE s.service_id <> '44444444-4444-4444-4444-444444444444';

-- ==========================================================
-- Add-ons: hand-written for the logo service, 2 per type for the rest
-- ==========================================================
INSERT INTO add_ons (add_on_id, name, description, price, currency, status, created_at, is_deleted, service_id)
VALUES ('77777777-7777-7777-7777-111111111111', 'Giao file source', 'Cung cấp file PSD/AI gốc', 500000, 'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('77777777-7777-7777-7777-222222222222', 'Thêm 1 concept', 'Thiết kế thêm 1 phương án logo', 800000, 'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('77777777-7777-7777-7777-333333333333', 'Giao gấp 24h', 'Hoàn thành và bàn giao trong vòng 24h', 1500000, 'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444');

INSERT INTO add_ons (add_on_id, name, description, price, currency, status, created_at, is_deleted, service_id)
SELECT md5(s.service_id::text || a.name)::uuid,
       a.name, a.description,
       ROUND(s.base_price * a.price_factor, -3),
       'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, s.service_id
FROM services s
JOIN (VALUES
    ('DIGITAL', 'Giao gấp',              'Rút ngắn 50% thời gian bàn giao',          0.5),
    ('DIGITAL', 'Thêm 2 lần chỉnh sửa',  'Thêm 2 lượt chỉnh sửa theo yêu cầu',       0.3),
    ('ONSITE',  'Phục vụ ngoài giờ',     'Làm việc sau 18h hoặc trước 7h',           0.3),
    ('ONSITE',  'Cuối tuần & ngày lễ',   'Phục vụ vào thứ 7, chủ nhật và ngày lễ',   0.2)
) AS a(execution_type, name, description, price_factor)
  ON a.execution_type = s.execution_type
WHERE s.service_id <> '44444444-4444-4444-4444-444444444444';

-- ==========================================================
-- Media: 2 placeholder images per service (picsum, seeded by slug)
-- ==========================================================
INSERT INTO service_medias (service_media_id, url, media_type, is_cover, created_at, is_deleted, service_id)
SELECT md5(s.service_id::text || 'media' || m.n)::uuid,
       'https://picsum.photos/seed/' || s.slug || '-' || m.n || '/1200/800',
       'IMAGE', m.n = 1, CURRENT_TIMESTAMP, 0, s.service_id
FROM services s
CROSS JOIN (VALUES (1), (2)) AS m(n);

-- ==========================================================
-- Availability: the landing-page sample rules, plus Mon-Sat
-- 08:00-12:00 and 13:00-17:00 for every ONSITE service
-- (day_of_weeek: 2 = Monday ... 8 = Sunday)
-- ==========================================================
INSERT INTO available_rules (available_rule_id, status, slot_duration_minute, start_time, end_time, day_of_weeek, created_at, is_deleted, service_id)
VALUES ('88888888-8888-8888-8888-111111111111', 'ACTIVE', 60, '1970-01-01 08:00:00', '1970-01-01 12:00:00', 2, CURRENT_TIMESTAMP, 0, '55555555-5555-5555-5555-555555555555'),
       ('88888888-8888-8888-8888-222222222222', 'ACTIVE', 60, '1970-01-01 13:00:00', '1970-01-01 17:00:00', 2, CURRENT_TIMESTAMP, 0, '55555555-5555-5555-5555-555555555555'),
       ('88888888-8888-8888-8888-333333333333', 'ACTIVE', 30, '1970-01-01 08:00:00', '1970-01-01 17:00:00', 3, CURRENT_TIMESTAMP, 0, '55555555-5555-5555-5555-555555555555');

INSERT INTO available_rules (available_rule_id, status, slot_duration_minute, start_time, end_time, day_of_weeek, created_at, is_deleted, service_id)
SELECT md5(s.service_id::text || 'rule' || d.day || h.shift)::uuid,
       'ACTIVE', 60, h.start_time::timestamptz, h.end_time::timestamptz, d.day,
       CURRENT_TIMESTAMP, 0, s.service_id
FROM services s
CROSS JOIN (VALUES (2), (3), (4), (5), (6), (7)) AS d(day)
CROSS JOIN (VALUES
    ('am', '1970-01-01 08:00:00', '1970-01-01 12:00:00'),
    ('pm', '1970-01-01 13:00:00', '1970-01-01 17:00:00')
) AS h(shift, start_time, end_time)
WHERE s.execution_type = 'ONSITE';
