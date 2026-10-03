-- 1. Xóa data cũ (tránh lỗi duplicate key khi khởi động lại ứng dụng nhiều lần)
-- Lưu ý: Cascade để xóa luôn các bảng phụ thuộc
DELETE FROM user_role;
DELETE FROM roles;
DELETE FROM users WHERE user_name = 'admin_test';

-- 2. Insert các Roles mặc định (bảng roles dùng String làm Khóa chính)
INSERT INTO roles (role_name) VALUES ('CLIENT');
INSERT INTO roles (role_name) VALUES ('PROVIDER');
INSERT INTO roles (role_name) VALUES ('ADMIN');

-- 3. Insert một User mẫu (Dùng UUID cứng để dễ dàng map sang các bảng khác)
-- Lưu ý: Mật khẩu dưới đây là mã hash BCrypt của chuỗi "123456"
INSERT INTO users (
    user_id, first_name, last_name, user_name, password,
    email, status, created_at
) VALUES (
             '550e8400-e29b-41d4-a716-446655440000',
             'Admin',
             'Test',
             'admin_test',
             '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
             'admin@workgo.com',
             'ACTIVE',
             CURRENT_TIMESTAMP
         );

-- 4. Gán quyền (Role) cho User mẫu ở trên
INSERT INTO user_role (
    user_role_id, granted_at, granted_by, user_id, role_name
) VALUES (
             gen_random_uuid(),
             CURRENT_TIMESTAMP,
             'System',
             '550e8400-e29b-41d4-a716-446655440000',
             'ADMIN'
         );

INSERT INTO user_role (
    user_role_id, granted_at, granted_by, user_id, role_name
) VALUES (
             gen_random_uuid(),
             CURRENT_TIMESTAMP,
             'System',
             '550e8400-e29b-41d4-a716-446655440000',
             'CLIENT'
         );