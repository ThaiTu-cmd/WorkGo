DELETE FROM booking_slots;
DELETE FROM available_rules;
DELETE FROM service_medias;
DELETE FROM add_ons;
DELETE FROM packages;
DELETE FROM services;
DELETE FROM categories;

INSERT INTO categories (category_id, name, slug, description, created_at, created_by, is_deleted)
VALUES ('11111111-1111-1111-1111-111111111111', 'Thiết kế Đồ họa', 'thiet-ke-do-hoa', 'Các dịch vụ thiết kế logo, banner, UI/UX', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-222222222222', 'Lập trình & IT', 'lap-trinh-it', 'Xây dựng website, app mobile, phần mềm', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0),
       ('11111111-1111-1111-1111-333333333333', 'Viết lách & Dịch thuật', 'viet-lach-dich-thuat', 'Sáng tạo nội dung, SEO, dịch thuật', CURRENT_TIMESTAMP, '99999999-9999-9999-9999-999999999999', 0);

INSERT INTO services (service_id, title, slug, description, base_price, currency, execution_type, status, provider_id, created_at, is_deleted, category_id)
VALUES ('44444444-4444-4444-4444-444444444444', 'Thiết kế Logo Doanh Nghiệp', 'thiet-ke-logo-doanh-nghiep', 'Thiết kế logo chuyên nghiệp, hiện đại.', 1000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-111111111111'),
       ('55555555-5555-5555-5555-555555555555', 'Lập trình Landing Page', 'lap-trinh-landing-page', 'Xây dựng Landing Page tối ưu chuyển đổi.', 3000000, 'VND', 'DIGITAL', 'PUBLISHED', '99999999-9999-9999-9999-999999999999', CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-222222222222'),
       ('66666666-6666-6666-6666-666666666666', 'Viết 10 bài chuẩn SEO', 'viet-10-bai-chuan-seo', 'Gói 10 bài viết 1000 chữ chuẩn SEO.', 2500000, 'VND', 'DIGITAL', 'PUBLISHED', '88888888-8888-8888-8888-888888888888', CURRENT_TIMESTAMP, 0, '11111111-1111-1111-1111-333333333333');

INSERT INTO packages (package_id, name, description, price, currency, delivery_days, duration_minute, revision_limit, package_status, created_at, is_deleted, service_id)
VALUES ('66666666-6666-6666-6666-111111111111', 'Gói Cơ Bản', 'Thiết kế 1 concept logo, bàn giao JPG', 1000000, 'VND', 3, 0, 1, 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('66666666-6666-6666-6666-222222222222', 'Gói Tiêu Chuẩn', 'Thiết kế 2 concept, bàn giao Vector', 2000000, 'VND', 5, 0, 3, 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('66666666-6666-6666-6666-333333333333', 'Gói Cao Cấp', 'Thiết kế 3 concept, bàn giao Vector + Brand Guideline', 5000000, 'VND', 7, 0, 5, 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444');

INSERT INTO add_ons (add_on_id, name, description, price, currency, status, created_at, is_deleted, service_id)
VALUES ('77777777-7777-7777-7777-111111111111', 'Giao file source', 'Cung cấp file PSD/AI gốc', 500000, 'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('77777777-7777-7777-7777-222222222222', 'Thêm 1 concept', 'Thiết kế thêm 1 phương án logo', 800000, 'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('77777777-7777-7777-7777-333333333333', 'Giao gấp 24h', 'Hoàn thành và bàn giao trong vòng 24h', 1500000, 'VND', 'ACTIVE', CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444');

INSERT INTO available_rules (available_rule_id, status, slot_duration_minute, start_time, end_time, day_of_weeek, created_at, is_deleted, service_id)
VALUES ('88888888-8888-8888-8888-111111111111', 'ACTIVE', 60, '1970-01-01 08:00:00', '1970-01-01 12:00:00', 2, CURRENT_TIMESTAMP, 0, '55555555-5555-5555-5555-555555555555'),
       ('88888888-8888-8888-8888-222222222222', 'ACTIVE', 60, '1970-01-01 13:00:00', '1970-01-01 17:00:00', 2, CURRENT_TIMESTAMP, 0, '55555555-5555-5555-5555-555555555555'),
       ('88888888-8888-8888-8888-333333333333', 'ACTIVE', 30, '1970-01-01 08:00:00', '1970-01-01 17:00:00', 3, CURRENT_TIMESTAMP, 0, '55555555-5555-5555-5555-555555555555');

INSERT INTO service_medias (service_media_id, url, media_type, is_cover, created_at, is_deleted, service_id)
VALUES ('99999999-9999-9999-9999-111111111111', 'https://example.com/logo-cover.jpg', 'IMAGE', true, CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('99999999-9999-9999-9999-222222222222', 'https://example.com/logo-2.jpg', 'IMAGE', false, CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444'),
       ('99999999-9999-9999-9999-333333333333', 'https://example.com/logo-video.mp4', 'VIDEO', false, CURRENT_TIMESTAMP, 0, '44444444-4444-4444-4444-444444444444');