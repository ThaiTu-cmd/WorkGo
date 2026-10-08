DELETE FROM addresses;
DELETE FROM provider_verification;
DELETE FROM provider_profiles;
DELETE FROM user_role;
DELETE FROM roles;
DELETE FROM users;

INSERT INTO roles (role_name) 
VALUES ('CLIENT'), 
       ('PROVIDER'), 
       ('ADMIN');

INSERT INTO users (user_id, first_name, last_name, user_name, password, phone, email, status, avatar_url, created_at)
VALUES 
    ('99999999-9999-9999-9999-999999999999', 'Nguyễn', 'Văn A', 'nguyenvana', '$2a$10$3nS0oU.i9g.u4D8V9Y/8e.lB/T5uK0l7P9.U/5G6zX1M6jU4U8.mO', '0901234567', 'vana@example.com', 'ACTIVE', 'https://example.com/avatar1.jpg', CURRENT_TIMESTAMP),
    ('88888888-8888-8888-8888-888888888888', 'Trần', 'Thị B', 'tranthib', '$2a$10$3nS0oU.i9g.u4D8V9Y/8e.lB/T5uK0l7P9.U/5G6zX1M6jU4U8.mO', '0901234568', 'thib@example.com', 'ACTIVE', 'https://example.com/avatar2.jpg', CURRENT_TIMESTAMP),
    ('77777777-7777-7777-7777-777777777777', 'Lê', 'Văn C', 'levanc', '$2a$10$3nS0oU.i9g.u4D8V9Y/8e.lB/T5uK0l7P9.U/5G6zX1M6jU4U8.mO', '0901234569', 'vanc@example.com', 'ACTIVE', 'https://example.com/avatar3.jpg', CURRENT_TIMESTAMP);

INSERT INTO user_role (user_role_id, granted_at, granted_by, user_id, role_name)
VALUES 
    (gen_random_uuid(), CURRENT_TIMESTAMP, 'system', '99999999-9999-9999-9999-999999999999', 'CLIENT'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, 'system', '99999999-9999-9999-9999-999999999999', 'PROVIDER'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, 'system', '88888888-8888-8888-8888-888888888888', 'CLIENT'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, 'system', '88888888-8888-8888-8888-888888888888', 'PROVIDER'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, 'system', '77777777-7777-7777-7777-777777777777', 'CLIENT');

-- ProviderType enum: INDIVIDUAL, COMPANY
INSERT INTO provider_profiles (provider_profile_id, provider_type, business_name, bio, verification_status, rating_avg, rating_count, completed_order_count, is_accepting_orders, joined_at, is_deleted, user_id)
VALUES 
    ('99999999-9999-9999-9999-999999999999', 'INDIVIDUAL', 'Văn A Studio', 'Chuyên thiết kế website', 'VERIFIED', 4.9, 120, 50, true, CURRENT_TIMESTAMP, 0, '99999999-9999-9999-9999-999999999999'),
    ('88888888-8888-8888-8888-888888888888', 'COMPANY', 'B Media', 'Đại lý truyền thông số 1', 'VERIFIED', 4.7, 85, 30, true, CURRENT_TIMESTAMP, 0, '88888888-8888-8888-8888-888888888888');

INSERT INTO addresses (address_id, label, contact_name, contact_phone, line1, ward, district, city, country_code, is_default, created_at, is_deleted, user_id)
VALUES 
    (gen_random_uuid(), 'Nhà riêng', 'Nguyễn Văn A', '0901234567', '123 Đường Số 1', 'Phường 1', 'Quận 1', 'TP HCM', 'VN', true, CURRENT_TIMESTAMP, 0, '99999999-9999-9999-9999-999999999999'),
    (gen_random_uuid(), 'Công ty', 'Nguyễn Văn A', '0901234567', '456 Tòa Nhà Bitexco', 'Bến Nghé', 'Quận 1', 'TP HCM', 'VN', false, CURRENT_TIMESTAMP, 0, '99999999-9999-9999-9999-999999999999'),
    (gen_random_uuid(), 'Nhà riêng', 'Trần Thị B', '0901234568', '789 Ngõ 10', 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội', 'VN', true, CURRENT_TIMESTAMP, 0, '88888888-8888-8888-8888-888888888888');