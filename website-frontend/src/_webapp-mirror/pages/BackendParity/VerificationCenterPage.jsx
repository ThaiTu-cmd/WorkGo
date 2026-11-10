import React, { useEffect, useState } from 'react';
import { getCurrentUser } from './mockAuth.js';
import {
  getVerifications,
  addVerification,
  removeVerification,
} from './mockVerification.js';
import styles from './VerificationCenterPage.module.css';

/**
 * VerificationCenterPage: Trung tâm xác thực danh tính & năng lực chuyên gia.
 * Hoàn toàn dùng mock store, đồng bộ qua CustomEvent workgo-verification-changed.
 */
export default function VerificationCenterPage({ onNavigate, onShowToast }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [verifications, setVerifications] = useState([]);

  // Form states
  const [verificationType, setVerificationType] = useState('IDENTITY');
  const [documentType, setDocumentType] = useState('CCCD');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const list = getVerifications();
    // Lọc theo người dùng hiện tại hoặc hiển thị toàn bộ trong môi trường demo
    setVerifications(list);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanNum = documentNumber.trim();
    if (!cleanNum || cleanNum.length < 8 || cleanNum.length > 20) {
      setError('Số giấy tờ phải từ 8 đến 20 ký tự chữ và số.');
      return;
    }

    if (documentUrl.trim() && !/^https?:\/\/.+/i.test(documentUrl.trim())) {
      setError('Đường dẫn tài liệu phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    if (note.length > 500) {
      setError('Ghi chú không được vượt quá 500 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      addVerification({
        userId: currentUser?.id || 'usr_demo_01',
        userName: currentUser?.name || 'Nguyễn Văn Chuyên Gia',
        userEmail: currentUser?.email || 'provider.demo@workgo.vn',
        verificationType,
        documentType,
        documentNumber: cleanNum,
        documentUrl: documentUrl.trim(),
        note: note.trim(),
      });

      // Reset form
      setDocumentNumber('');
      setDocumentUrl('');
      setNote('');
      loadData();

      if (onShowToast) {
        onShowToast('Hồ sơ xác thực đã được gửi thành công và đang chờ duyệt!');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = (id) => {
    if (removeVerification(id)) {
      loadData();
      if (onShowToast) {
        onShowToast('Đã rút hồ sơ xác thực thành công.');
      }
    }
  };

  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // Gate kiểm tra đăng nhập
  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loginGateCard}>
          <div className={styles.gateIcon}>🔒</div>
          <h1 className={styles.gateTitle}>Yêu cầu đăng nhập</h1>
          <p className={styles.gateDesc}>
            Bạn cần đăng nhập tài khoản Chuyên gia để truy cập Trung tâm xác thực danh tính và gửi hồ sơ kiểm duyệt.
          </p>
          <div className={styles.gateActions}>
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className={styles.btnPrimary}
            >
              Đăng nhập ngay
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
        <button
          type="button"
          onClick={() => navigateTo('provider-onboarding')}
          className={styles.breadcrumbLink}
        >
          Trở thành Chuyên gia
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Trung tâm Xác thực</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Trung tâm Xác thực Chuyên gia (Verification Center)</h1>
        <p className={styles.subtitle}>
          Nâng cao độ uy tín của hồ sơ dịch vụ, nhận huy hiệu xác thực và mở khóa hạn mức rút tiền cao hơn.
        </p>
      </header>

      <div className={styles.mainGrid}>
        {/* Form gửi hồ sơ mới */}
        <section className={styles.formSection}>
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>Gửi hồ sơ xác thực mới</h2>
            {error && <div className={styles.alertError}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="verif-type" className={styles.label}>Loại hình xác thực *</label>
                <select
                  id="verif-type"
                  className={styles.select}
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                >
                  <option value="IDENTITY">Cá nhân (Xác minh nhân thân)</option>
                  <option value="BUSINESS">Doanh nghiệp / Tổ chức kinh doanh</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-type" className={styles.label}>Loại giấy tờ xác minh *</label>
                <select
                  id="doc-type"
                  className={styles.select}
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  {verificationType === 'IDENTITY' ? (
                    <>
                      <option value="CCCD">Căn cước công dân (CCCD / CMND)</option>
                      <option value="PASSPORT">Hộ chiếu (Passport)</option>
                    </>
                  ) : (
                    <option value="BUSINESS_LICENSE">Giấy phép đăng ký kinh doanh (ĐKKD)</option>
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-num" className={styles.label}>Số giấy tờ * (8 - 20 ký tự)</label>
                <input
                  id="doc-num"
                  type="text"
                  className={styles.input}
                  placeholder="Ví dụ: 001095012345"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-url" className={styles.label}>Đường dẫn ảnh chụp tài liệu (tùy chọn)</label>
                <input
                  id="doc-url"
                  type="url"
                  className={styles.input}
                  placeholder="https://example.com/anh-giay-to.jpg"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
                <span className={styles.helpText}>Dán liên kết ảnh tài liệu rõ nét 2 mặt để duyệt nhanh hơn.</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-note" className={styles.label}>Ghi chú thêm cho kiểm duyệt viên</label>
                <textarea
                  id="doc-note"
                  rows={3}
                  className={styles.textarea}
                  placeholder="Thông tin bổ sung về chuyên môn, chứng chỉ nghề nghiệp nếu có..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                />
                <span className={styles.charCount}>{note.length}/500 ký tự</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.btnPrimary}
              >
                {isSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ kiểm duyệt'}
              </button>
            </form>
          </div>
        </section>

        {/* Danh sách hồ sơ đã gửi & Timeline */}
        <section className={styles.listSection}>
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>Hồ sơ xác thực của bạn</h2>

            {verifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Chưa có hồ sơ xác thực nào được gửi.</p>
                <span className={styles.emptySub}>Hãy điền mẫu bên cạnh để bắt đầu quá trình xác minh.</span>
              </div>
            ) : (
              <div className={styles.verifList}>
                {verifications.map((item) => (
                  <div key={item.id} className={styles.verifItem}>
                    <div className={styles.verifHeader}>
                      <div className={styles.verifTypeInfo}>
                        <span className={styles.verifBadgeType}>
                          {item.verificationType === 'IDENTITY' ? 'Cá nhân' : 'Doanh nghiệp'}
                        </span>
                        <strong className={styles.verifDocTitle}>
                          {item.documentType}: {item.documentNumber}
                        </strong>
                      </div>

                      {/* Trạng thái duyệt */}
                      <span
                        className={
                          item.status === 'VERIFIED'
                            ? styles.statusVerified
                            : item.status === 'REJECTED'
                            ? styles.statusRejected
                            : styles.statusPending
                        }
                      >
                        {item.status === 'VERIFIED' && '✓ Đã xác thực (VERIFIED)'}
                        {item.status === 'REJECTED' && '✕ Bị từ chối (REJECTED)'}
                        {item.status === 'PENDING' && '⏳ Chờ duyệt (PENDING)'}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className={styles.timeline}>
                      <div className={styles.timelineRow}>
                        <span className={styles.timelineLabel}>Ngày gửi:</span>
                        <span className={styles.timelineVal}>
                          {new Date(item.submittedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      {item.reviewedAt && (
                        <div className={styles.timelineRow}>
                          <span className={styles.timelineLabel}>Ngày xử lý:</span>
                          <span className={styles.timelineVal}>
                            {new Date(item.reviewedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {item.reviewerNote && (
                        <div className={styles.timelineRow}>
                          <span className={styles.timelineLabel}>Nhận xét admin:</span>
                          <span className={styles.reviewerNote}>{item.reviewerNote}</span>
                        </div>
                      )}
                    </div>

                    {/* Nút hành động cho hồ sơ PENDING */}
                    {item.status === 'PENDING' && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          onClick={() => handleWithdraw(item.id)}
                          className={styles.btnWithdraw}
                        >
                          Rút hồ sơ / Hủy yêu cầu
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
