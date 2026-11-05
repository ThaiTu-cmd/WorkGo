import React, { useEffect, useState } from 'react';
import { verificationApi } from '../../api/verificationApi';
import { authApi } from '../../api/authApi';
import { getAccessToken } from '../../api/axiosClient';
import { Loader2 } from 'lucide-react';
import styles from './VerificationCenterPage.module.css';

/**
 * VerificationCenterPage: Trung tâm xác thực danh tính & năng lực chuyên gia.
 * Kết nối trực tiếp 100% database identity_db qua verificationApi.
 */
export default function VerificationCenterPage({ onNavigate, onShowToast }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [verificationType, setVerificationType] = useState('IDENTITY_CARD');
  const [documentType, setDocumentType] = useState('CCCD');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const hasPending = verifications.some((v) => (v.verificationStatus || v.status) === 'PENDING');

  const loadData = async () => {
    const token = getAccessToken();
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const userRes = await authApi.getMyInfo().catch(() => null);
      if (userRes?.result) {
        setCurrentUser(userRes.result);
      } else {
        setCurrentUser({ name: 'Chuyên gia WorkGo' });
      }

      const res = await verificationApi.getMy({ page: 0, size: 50 });
      const data = res?.result?.data || (Array.isArray(res?.result) ? res.result : []);
      setVerifications(Array.isArray(data) ? data : []);
    } catch (err) {
      // 403/401 handling
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('workgo-verification-changed', handleSync);
      window.addEventListener('workgo-auth-changed', handleSync);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('workgo-verification-changed', handleSync);
        window.removeEventListener('workgo-auth-changed', handleSync);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (hasPending) {
      setError('Bạn đang có 1 hồ sơ xác thực đang chờ quản trị viên duyệt. Vui lòng rút hồ sơ cũ trước khi nộp hồ sơ mới.');
      return;
    }

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
      await verificationApi.submit({
        verificationType,
        documentType,
        documentNumber: cleanNum,
        documentUrl: documentUrl.trim() || undefined,
        note: note.trim() || undefined,
      });

      // Reset form
      setDocumentNumber('');
      setDocumentUrl('');
      setNote('');
      await loadData();

      if (onShowToast) {
        onShowToast('Hồ sơ xác thực đã được gửi thành công và đang chờ duyệt!');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-verification-changed'));
      }
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (id) => {
    setActionLoadingId(id);
    try {
      await verificationApi.remove(id);
      // Cập nhật trạng thái lạc quan ngay lập tức để mở lại form
      setVerifications((prev) => prev.filter((v) => (v.providerVerificationId || v.id) !== id));
      setError('');
      await loadData();
      if (onShowToast) {
        onShowToast('Đã rút hồ sơ xác thực thành công.');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-verification-changed'));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Không thể rút hồ sơ: ${err?.message || 'Lỗi thao tác'}`);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // Gate kiểm tra đăng nhập
  const token = getAccessToken();
  if (!token && !loading) {
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
            {hasPending && (
              <div className={styles.alertWarning}>
                ⚠️ <strong>Lưu ý:</strong> Bạn đang có 1 hồ sơ xác thực đang chờ quản trị viên duyệt. Hệ thống chỉ cho phép 1 hồ sơ chờ duyệt tại một thời điểm. Vui lòng chờ duyệt hoặc bấm <em>&quot;Rút hồ sơ / Hủy yêu cầu&quot;</em> ở danh sách bên dưới nếu muốn gửi lại thông tin mới.
              </div>
            )}
            {error && <div className={styles.alertError}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="verif-type" className={styles.label}>Loại hình xác thực *</label>
                <select
                  id="verif-type"
                  className={styles.select}
                  value={verificationType}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setVerificationType(nextVal);
                    if (nextVal === 'IDENTITY_CARD') setDocumentType('CCCD');
                    else if (nextVal === 'BUSINESS_LICENSE') setDocumentType('DKKD');
                    else if (nextVal === 'TAX_CODE') setDocumentType('MST');
                    else if (nextVal === 'PROFESSIONAL_CERT') setDocumentType('CERT');
                  }}
                >
                  <option value="IDENTITY_CARD">Cá nhân (Xác minh nhân thân)</option>
                  <option value="BUSINESS_LICENSE">Doanh nghiệp / Giấy phép ĐKKD</option>
                  <option value="TAX_CODE">Mã số thuế doanh nghiệp / cá nhân</option>
                  <option value="PROFESSIONAL_CERT">Chứng chỉ hành nghề chuyên môn</option>
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
                  {verificationType === 'IDENTITY_CARD' ? (
                    <>
                      <option value="CCCD">Căn cước công dân (CCCD / CMND)</option>
                      <option value="PASSPORT">Hộ chiếu (Passport)</option>
                    </>
                  ) : verificationType === 'BUSINESS_LICENSE' ? (
                    <option value="DKKD">Giấy phép đăng ký kinh doanh (ĐKKD)</option>
                  ) : verificationType === 'TAX_CODE' ? (
                    <option value="MST">Giấy chứng nhận mã số thuế</option>
                  ) : (
                    <option value="CERT">Chứng chỉ chuyên môn hành nghề</option>
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
                disabled={isSubmitting || hasPending}
                className={styles.btnPrimary}
                style={hasPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                {isSubmitting ? 'Đang gửi hồ sơ...' : hasPending ? 'Đang có hồ sơ chờ duyệt' : 'Gửi hồ sơ kiểm duyệt'}
              </button>
            </form>
          </div>
        </section>

        {/* Danh sách hồ sơ đã gửi & Timeline */}
        <section className={styles.listSection}>
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>Hồ sơ xác thực của bạn</h2>

            {loading ? (
              <div className={styles.emptyState} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <p className={styles.emptyText}>Đang tải hồ sơ từ máy chủ...</p>
              </div>
            ) : verifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>Chưa có hồ sơ xác thực nào được gửi.</p>
                <span className={styles.emptySub}>Hãy điền mẫu bên cạnh để bắt đầu quá trình xác minh.</span>
              </div>
            ) : (
              <div className={styles.verifList}>
                {verifications.map((item) => {
                  const id = item.providerVerificationId || item.id;
                  const vStatus = item.verificationStatus || item.status;
                  const isWithdrawing = actionLoadingId === id;

                  return (
                    <div key={id} className={styles.verifItem}>
                      <div className={styles.verifHeader}>
                        <div className={styles.verifTypeInfo}>
                          <span className={styles.verifBadgeType}>
                            {item.verificationType === 'IDENTITY_CARD'
                              ? 'Cá nhân'
                              : item.verificationType === 'BUSINESS_LICENSE'
                              ? 'Doanh nghiệp'
                              : item.verificationType === 'TAX_CODE'
                              ? 'Mã số thuế'
                              : 'Chứng chỉ'}
                          </span>
                          <strong className={styles.verifDocTitle}>
                            {item.documentType}: {item.documentNumber || id.slice(0, 8)}
                          </strong>
                        </div>

                        {/* Trạng thái duyệt */}
                        <span
                          className={
                            vStatus === 'VERIFIED'
                              ? styles.statusVerified
                              : vStatus === 'REJECTED'
                              ? styles.statusRejected
                              : styles.statusPending
                          }
                        >
                          {vStatus === 'VERIFIED' && '✓ Đã xác thực (VERIFIED)'}
                          {vStatus === 'REJECTED' && '✕ Bị từ chối (REJECTED)'}
                          {vStatus === 'PENDING' && '⏳ Chờ duyệt (PENDING)'}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className={styles.timeline}>
                        <div className={styles.timelineRow}>
                          <span className={styles.timelineLabel}>Ngày gửi:</span>
                          <span className={styles.timelineVal}>
                            {item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : (item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—')}
                          </span>
                        </div>
                        {item.verifiedAt && (
                          <div className={styles.timelineRow}>
                            <span className={styles.timelineLabel}>Ngày xử lý:</span>
                            <span className={styles.timelineVal}>
                              {new Date(item.verifiedAt).toLocaleString('vi-VN')}
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
                      {vStatus === 'PENDING' && (
                        <div className={styles.itemActions}>
                          <button
                            type="button"
                            disabled={isWithdrawing}
                            onClick={() => handleWithdraw(id)}
                            className={styles.btnWithdraw}
                          >
                            {isWithdrawing ? 'Đang rút...' : 'Rút hồ sơ / Hủy yêu cầu'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
