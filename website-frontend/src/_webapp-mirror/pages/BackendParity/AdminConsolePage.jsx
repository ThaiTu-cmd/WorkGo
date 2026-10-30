import React, { useEffect, useState } from 'react';
import { getCurrentUser, setCurrentUser } from './mockAuth.js';
import { getAdminUsers, updateUserStatus } from './mockAdmin.js';
import { getVerifications, reviewVerification } from './mockVerification.js';
import styles from './AdminConsolePage.module.css';

/**
 * AdminConsolePage: Bảng điều khiển Quản trị viên hệ thống WorkGo.
 * Giới hạn truy cập nghiêm ngặt chỉ dành cho tài khoản admin@workgo.vn.
 */
export default function AdminConsolePage({ onNavigate, onShowToast }) {
  const [currentUser, setUserState] = useState(null);
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'users'
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);

  // Modal / Prompt duyệt
  const [reviewNote, setReviewNote] = useState('');
  const [selectedVerifId, setSelectedVerifId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'VERIFIED' | 'REJECTED'

  const loadData = () => {
    const user = getCurrentUser();
    setUserState(user);
    if (user?.email === 'admin@workgo.vn') {
      setUsers(getAdminUsers());
      setVerifications(getVerifications());
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('workgo-verification-changed', handleSync);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('workgo-verification-changed', handleSync);
      }
    };
  }, []);

  const handleReview = (id, status) => {
    setSelectedVerifId(id);
    setActionType(status);
    setReviewNote(status === 'VERIFIED' ? 'Hồ sơ đầy đủ, thông tin hợp lệ.' : 'Giấy tờ không rõ nét hoặc thiếu thông tin đối chiếu.');
  };

  const confirmReview = () => {
    if (!selectedVerifId || !actionType) return;
    const res = reviewVerification(selectedVerifId, actionType, reviewNote);
    if (res) {
      loadData();
      if (onShowToast) {
        onShowToast(`Đã ${actionType === 'VERIFIED' ? 'duyệt' : 'từ chối'} hồ sơ ${selectedVerifId}!`);
      }
    }
    setSelectedVerifId(null);
    setActionType(null);
    setReviewNote('');
  };

  const handleToggleUserStatus = (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateUserStatus(userId, newStatus);
    loadData();
    if (onShowToast) {
      onShowToast(`Đã cập nhật trạng thái người dùng thành: ${newStatus}`);
    }
  };

  // Tiện ích chuyển nhanh tài khoản admin trong môi trường demo
  const handleSwitchToAdmin = () => {
    const adminUser = {
      id: 'usr_admin_01',
      name: 'Quản Trị Viên WorkGo',
      email: 'admin@workgo.vn',
      role: 'ADMIN',
    };
    setCurrentUser(adminUser);
    setUserState(adminUser);
    setUsers(getAdminUsers());
    setVerifications(getVerifications());
    if (onShowToast) {
      onShowToast('Đã chuyển sang tài khoản Admin (admin@workgo.vn) thành công!');
    }
  };

  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // GATE BẢO MẬT: Bắt buộc tài khoản phải là admin@workgo.vn
  if (!currentUser || currentUser.email !== 'admin@workgo.vn') {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorizedCard}>
          <div className={styles.unauthorizedIcon}>🚫</div>
          <h1 className={styles.unauthorizedTitle}>403 - Không có quyền truy cập</h1>
          <p className={styles.unauthorizedDesc}>
            Trang này dành riêng cho quản trị viên hệ thống (admin@workgo.vn). Tài khoản hiện tại không có quyền xem hoặc chỉnh sửa dữ liệu này.
          </p>
          <div className={styles.unauthorizedActions}>
            <button
              type="button"
              onClick={handleSwitchToAdmin}
              className={styles.btnPrimary}
            >
              Đăng nhập với admin@workgo.vn (Chế độ Demo)
            </button>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={styles.btnSecondary}
            >
              Về Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={styles.breadcrumbLink}
        >
          Trang chủ
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Bảng điều khiển Quản trị</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Bảng điều khiển Quản trị viên (Admin Console)</h1>
          <p className={styles.subtitle}>
            Xin chào, <strong>{currentUser.name}</strong> ({currentUser.email}) • Phân quyền: <span className={styles.badgeRole}>Hệ thống Toàn quyền</span>
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          className={`${styles.tabBtn} ${activeTab === 'verifications' ? styles.tabBtnActive : ''}`}
        >
          Hàng chờ xác thực Chuyên gia ({verifications.filter((v) => v.status === 'PENDING').length} đang chờ)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
        >
          Quản lý Người dùng ({users.length})
        </button>
      </div>

      {/* Tab 1: Verification Queue */}
      {activeTab === 'verifications' && (
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Danh sách hồ sơ xác thực Chuyên gia</h2>

          {verifications.length === 0 ? (
            <p className={styles.emptyText}>Hiện không có hồ sơ xác thực nào trong hệ thống.</p>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã hồ sơ</th>
                    <th>Chuyên gia</th>
                    <th>Loại & Giấy tờ</th>
                    <th>Ngày gửi</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((v) => (
                    <tr key={v.id}>
                      <td><code className={styles.codeBadge}>{v.id}</code></td>
                      <td>
                        <div className={styles.userCell}>
                          <strong>{v.userName}</strong>
                          <span className={styles.userEmail}>{v.userEmail}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.docInfo}>
                          {v.verificationType} • {v.documentType}: {v.documentNumber}
                        </span>
                        {v.documentUrl && (
                          <div className={styles.linkWrap}>
                            <a
                              href={v.documentUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className={styles.docLink}
                            >
                              Xem ảnh tài liệu ↗
                            </a>
                          </div>
                        )}
                      </td>
                      <td>{new Date(v.submittedAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span
                          className={
                            v.status === 'VERIFIED'
                              ? styles.badgeVerified
                              : v.status === 'REJECTED'
                              ? styles.badgeRejected
                              : styles.badgePending
                          }
                        >
                          {v.status}
                        </span>
                      </td>
                      <td>
                        {v.status === 'PENDING' ? (
                          <div className={styles.actionButtonGroup}>
                            <button
                              type="button"
                              onClick={() => handleReview(v.id, 'VERIFIED')}
                              className={styles.btnApprove}
                            >
                              Duyệt (VERIFIED)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(v.id, 'REJECTED')}
                              className={styles.btnReject}
                            >
                              Từ chối (REJECTED)
                            </button>
                          </div>
                        ) : (
                          <span className={styles.reviewedText}>
                            Đã xử lý lúc {v.reviewedAt ? new Date(v.reviewedAt).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Danh sách người dùng hệ thống</h2>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã người dùng</th>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><code className={styles.codeBadge}>{u.id}</code></td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={styles.roleTag}>{u.role}</span>
                    </td>
                    <td>
                      <span className={u.status === 'ACTIVE' ? styles.badgeActive : styles.badgeSuspended}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={u.status === 'ACTIVE' ? styles.btnSuspend : styles.btnActivate}
                        >
                          {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal xác nhận kiểm duyệt */}
      {selectedVerifId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              Xác nhận {actionType === 'VERIFIED' ? 'DUYỆT' : 'TỪ CHỐI'} hồ sơ: {selectedVerifId}
            </h3>
            <p className={styles.modalDesc}>
              Nhập ghi chú phản hồi gửi cho chuyên gia:
            </p>
            <textarea
              rows={3}
              className={styles.modalTextarea}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setSelectedVerifId(null);
                  setActionType(null);
                }}
                className={styles.btnSecondary}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmReview}
                className={actionType === 'VERIFIED' ? styles.btnApprove : styles.btnReject}
              >
                Xác nhận {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
