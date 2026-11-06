import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { authApi } from '../../api/authApi';
import { getAccessToken } from '../../api/axiosClient';
import { hasRole, decodeToken } from '../../utils/jwt';
import { Loader2 } from 'lucide-react';
import styles from './AdminConsolePage.module.css';

/**
 * AdminConsolePage: Bảng điều khiển Quản trị viên hệ thống WorkGo.
 * Kết nối 100% database backend qua adminApi.
 * Giới hạn truy cập cho tài khoản có quyền ADMIN.
 */
export default function AdminConsolePage({ onNavigate, onShowToast }) {
  const [currentUser, setUserState] = useState(null);
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'providers' | 'categories' | 'users'
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingProviderId, setActionLoadingProviderId] = useState(null);

  // Modal / Prompt duyệt
  const [reviewNote, setReviewNote] = useState('');
  const [selectedVerifId, setSelectedVerifId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'VERIFIED' | 'REJECTED'
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const token = getAccessToken();
  const isAdmin = hasRole(token, 'ADMIN') || decodeToken(token)?.scope?.includes('ROLE_ADMIN') || false;

  const loadProviders = async (status = providerFilter) => {
    try {
      if (status === 'ALL') {
        const [pPending, pVerified, pSuspended] = await Promise.allSettled([
          adminApi.listProviders({ status: 'PENDING', page: 0, size: 50 }),
          adminApi.listProviders({ status: 'VERIFIED', page: 0, size: 50 }),
          adminApi.listProviders({ status: 'SUSPENDED', page: 0, size: 50 }),
        ]);
        const all = [];
        if (pPending.status === 'fulfilled') all.push(...(pPending.value?.result?.data || []));
        if (pVerified.status === 'fulfilled') all.push(...(pVerified.value?.result?.data || []));
        if (pSuspended.status === 'fulfilled') all.push(...(pSuspended.value?.result?.data || []));
        setProviders(all);
      } else {
        const res = await adminApi.listProviders({ status, page: 0, size: 50 });
        const list = res?.result?.data || (Array.isArray(res?.result) ? res.result : []);
        setProviders(Array.isArray(list) ? list : []);
      }
    } catch {
      setProviders([]);
    }
  };

  const loadData = async () => {
    const currentToken = getAccessToken();
    if (!currentToken) {
      setUserState(null);
      setLoading(false);
      return;
    }

    try {
      const myInfoRes = await authApi.getMyInfo().catch(() => null);
      const user = myInfoRes?.result || { name: 'Admin WorkGo', email: 'admin@workgo.vn', role: 'ADMIN' };
      setUserState(user);

      // Tải verifications, users, providers, categories
      const [verifRes, usersRes, provRes, catRes] = await Promise.allSettled([
        adminApi.listVerifications({ status: 'PENDING', page: 0, size: 50 }),
        adminApi.listUsers({ page: 0, size: 50 }),
        adminApi.listProviders({ status: 'VERIFIED', page: 0, size: 50 }),
        adminApi.listCategories({ page: 0, size: 50 }),
      ]);

      if (verifRes.status === 'fulfilled') {
        const vData = verifRes.value?.result?.data || (Array.isArray(verifRes.value?.result) ? verifRes.value.result : []);
        setVerifications(Array.isArray(vData) ? vData : []);
      }

      if (usersRes.status === 'fulfilled') {
        const uData = usersRes.value?.result?.data || (Array.isArray(usersRes.value?.result) ? usersRes.value.result : []);
        setUsers(Array.isArray(uData) ? uData : []);
      }

      if (provRes.status === 'fulfilled') {
        const pData = provRes.value?.result?.data || (Array.isArray(provRes.value?.result) ? provRes.value.result : []);
        setProviders(Array.isArray(pData) ? pData : []);
      }

      if (catRes.status === 'fulfilled') {
        const cData = catRes.value?.result?.data || (Array.isArray(catRes.value?.result) ? catRes.value.result : []);
        setCategories(Array.isArray(cData) ? cData : []);
      }
    } catch {
      // fallback
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

  const handleReview = (id, status) => {
    setSelectedVerifId(id);
    setActionType(status);
    setReviewNote(status === 'VERIFIED' ? 'Hồ sơ đầy đủ, thông tin hợp lệ.' : 'Giấy tờ không rõ nét hoặc thiếu thông tin đối chiếu.');
  };

  const confirmReview = async () => {
    if (!selectedVerifId || !actionType || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      await adminApi.reviewVerification(selectedVerifId, actionType);
      await loadData();
      if (onShowToast) {
        onShowToast(`Đã ${actionType === 'VERIFIED' ? 'duyệt' : 'từ chối'} hồ sơ ${selectedVerifId}!`);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-verification-changed'));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Không thể xử lý hồ sơ: ${err?.message || 'Lỗi thao tác'}`);
      }
    } finally {
      setReviewSubmitting(false);
      setSelectedVerifId(null);
      setActionType(null);
      setReviewNote('');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminApi.updateUser(userId, { status: newStatus });
      await loadData();
      if (onShowToast) {
        onShowToast(`Đã cập nhật trạng thái người dùng thành: ${newStatus}`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Không thể cập nhật trạng thái: ${err?.message || 'Lỗi thao tác'}`);
      }
    }
  };

  const handleSetProviderStatus = async (providerId, status) => {
    setActionLoadingProviderId(providerId);
    try {
      await adminApi.setProviderStatus(providerId, status);
      if (onShowToast) {
        onShowToast(`Đã cập nhật trạng thái chuyên gia thành ${status}!`);
      }
      await loadProviders(providerFilter);
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Không thể cập nhật trạng thái chuyên gia: ${err?.message || 'Lỗi thao tác'}`);
      }
    } finally {
      setActionLoadingProviderId(null);
    }
  };

  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // GATE BẢO MẬT: Bắt buộc tài khoản có quyền ADMIN
  if (!isAdmin && !loading) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorizedCard}>
          <div className={styles.unauthorizedIcon}>🚫</div>
          <h1 className={styles.unauthorizedTitle}>403 - Không có quyền truy cập</h1>
          <p className={styles.unauthorizedDesc}>
            Trang này dành riêng cho quản trị viên hệ thống có quyền ADMIN. Tài khoản hiện tại không có quyền xem hoặc chỉnh sửa dữ liệu này.
          </p>
          <div className={styles.unauthorizedActions}>
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className={styles.btnPrimary}
            >
              Đăng nhập tài khoản Quản trị
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
            Xin chào, <strong>{currentUser?.name || 'Admin'}</strong> ({currentUser?.email || 'admin@workgo.vn'}) • Phân quyền: <span className={styles.badgeRole}>Quản trị viên Hệ thống</span>
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
          Hàng chờ xác thực ({verifications.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('providers');
            loadProviders(providerFilter);
          }}
          className={`${styles.tabBtn} ${activeTab === 'providers' ? styles.tabBtnActive : ''}`}
        >
          Quản lý Chuyên gia ({providers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}
        >
          Danh mục Dịch vụ ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
        >
          Quản lý Người dùng ({users.length})
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '8px' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Đang tải dữ liệu từ cơ sở dữ liệu...</span>
        </div>
      )}

      {/* Tab 1: Verification Queue */}
      {!loading && activeTab === 'verifications' && (
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Danh sách hồ sơ xác thực Chuyên gia</h2>

          {verifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
              <p style={{ fontWeight: 600, color: '#334155', fontSize: '1rem', margin: '0 0 4px 0' }}>
                Hàng chờ xác thực hiện đang trống
              </p>
              <span style={{ fontSize: '0.85rem' }}>
                Tất cả hồ sơ gửi từ các chuyên gia đã được duyệt hoặc chưa có hồ sơ mới cần xử lý.
              </span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã hồ sơ</th>
                    <th>Chuyên gia</th>
                    <th>Loại &amp; Giấy tờ</th>
                    <th>Ngày gửi</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((v) => {
                    const id = v.providerVerificationId || v.id;
                    const vStatus = v.verificationStatus || v.status;
                    const submitted = v.submittedAt || v.createdAt;

                    return (
                      <tr key={id}>
                        <td><code className={styles.codeBadge}>{String(id).slice(0, 8)}</code></td>
                        <td>
                          <div className={styles.userCell}>
                            <strong>{v.userName || v.providerProfileId || 'Chuyên gia'}</strong>
                            <span className={styles.userEmail}>{v.userEmail || ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.docInfo}>
                            {v.verificationType} • {v.documentType}: {v.documentNumber || id.slice(0, 8)}
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
                        <td>{submitted ? new Date(submitted).toLocaleDateString('vi-VN') : '—'}</td>
                        <td>
                          <span
                            className={
                              vStatus === 'VERIFIED'
                                ? styles.badgeVerified
                                : vStatus === 'REJECTED'
                                ? styles.badgeRejected
                                : styles.badgePending
                            }
                          >
                            {vStatus}
                          </span>
                        </td>
                        <td>
                          {vStatus === 'PENDING' ? (
                            <div className={styles.actionButtonGroup}>
                              <button
                                type="button"
                                onClick={() => handleReview(id, 'VERIFIED')}
                                className={styles.btnApprove}
                              >
                                Duyệt (VERIFIED)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReview(id, 'REJECTED')}
                                className={styles.btnReject}
                              >
                                Từ chối (REJECTED)
                              </button>
                            </div>
                          ) : (
                            <span className={styles.reviewedText}>
                              Đã xử lý lúc {v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString('vi-VN') : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab: Provider Management */}
      {!loading && activeTab === 'providers' && (
        <section className={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Quản lý Hồ sơ Chuyên gia (Providers)</h2>
            <div className={styles.filterRow} style={{ margin: 0 }}>
              {['ALL', 'VERIFIED', 'PENDING', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setProviderFilter(st);
                    loadProviders(st);
                  }}
                  className={`${styles.filterBtn} ${providerFilter === st ? styles.filterBtnActive : ''}`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'VERIFIED' ? 'Đã duyệt' : st === 'PENDING' ? 'Chờ duyệt' : 'Đang tạm khóa'}
                </button>
              ))}
            </div>
          </div>

          {providers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💼</div>
              <p style={{ fontWeight: 600, color: '#334155', fontSize: '1rem', margin: '0 0 4px 0' }}>
                Không tìm thấy hồ sơ chuyên gia nào
              </p>
              <span style={{ fontSize: '0.85rem' }}>
                Chưa có chuyên gia nào phù hợp với bộ lọc trạng thái đã chọn.
              </span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã chuyên gia</th>
                    <th>Tên / Doanh nghiệp</th>
                    <th>Loại hình</th>
                    <th>Giới thiệu</th>
                    <th>Đơn hoàn tất / Đánh giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => {
                    const pid = p.providerProfileId || p.id;
                    const pStatus = p.verificationStatus || p.status || 'PENDING';
                    const isBusy = actionLoadingProviderId === pid;

                    return (
                      <tr key={pid}>
                        <td><code className={styles.codeBadge}>{String(pid).slice(0, 8)}</code></td>
                        <td>
                          <strong>{p.businessName || 'Chuyên gia WorkGo'}</strong>
                        </td>
                        <td>
                          <span className={p.providerType === 'BUSINESS' ? styles.badgeBusiness : styles.badgeIndividual}>
                            {p.providerType === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '240px', fontSize: '0.82rem', color: '#475569' }}>
                          {p.bio || '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {p.completedOrderCount ?? 0} đơn • ⭐ {p.ratingAvg ?? 5.0} ({p.ratingCount ?? 0})
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              pStatus === 'VERIFIED'
                                ? styles.badgeVerified
                                : pStatus === 'SUSPENDED'
                                ? styles.badgeSuspended
                                : styles.badgePending
                            }
                          >
                            {pStatus}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtonGroup}>
                            {pStatus !== 'VERIFIED' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSetProviderStatus(pid, 'VERIFIED')}
                                className={styles.btnApprove}
                              >
                                {isBusy ? '...' : 'Duyệt'}
                              </button>
                            )}
                            {pStatus !== 'SUSPENDED' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSetProviderStatus(pid, 'SUSPENDED')}
                                className={styles.btnSuspend}
                              >
                                {isBusy ? '...' : 'Khóa'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab: Category Management */}
      {!loading && activeTab === 'categories' && (
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Danh mục Dịch vụ Hệ thống (Categories)</h2>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🗂️</div>
              <p style={{ fontWeight: 600, color: '#334155', fontSize: '1rem', margin: '0 0 4px 0' }}>
                Chưa có danh mục dịch vụ nào
              </p>
              <span style={{ fontSize: '0.85rem' }}>
                Hệ thống chưa ghi nhận danh mục dịch vụ nào trong cơ sở dữ liệu.
              </span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã danh mục</th>
                    <th>Tên danh mục</th>
                    <th>Đường dẫn (Slug)</th>
                    <th>Mô tả</th>
                    <th>Danh mục cha</th>
                    <th>Mục con</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const cid = c.categoryId || c.id;
                    return (
                      <tr key={cid}>
                        <td><code className={styles.codeBadge}>{String(cid).slice(0, 8)}</code></td>
                        <td><strong>{c.name}</strong></td>
                        <td><code style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.slug}</code></td>
                        <td style={{ maxWidth: '280px', fontSize: '0.82rem', color: '#475569' }}>
                          {c.description || '—'}
                        </td>
                        <td>
                          <span className={styles.roleTag}>
                            {c.parent ? (c.parent.name || String(c.parent.categoryId || c.parent).slice(0, 8)) : 'Danh mục gốc'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                            {Array.isArray(c.children) ? `${c.children.length} mục con` : '0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: User Management */}
      {!loading && activeTab === 'users' && (
        <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Danh sách người dùng hệ thống</h2>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👥</div>
              <p style={{ fontWeight: 600, color: '#334155', fontSize: '1rem', margin: '0 0 4px 0' }}>
                Chưa có tài khoản người dùng nào
              </p>
              <span style={{ fontSize: '0.85rem' }}>
                Hệ thống chưa ghi nhận người dùng nào trong cơ sở dữ liệu.
              </span>
            </div>
          ) : (
            <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã người dùng</th>
                  <th>Họ và tên</th>
                  <th>Username / Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const uid = u.userId || u.id;
                  const uName = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || 'Người dùng';
                  const uStatus = u.status || 'ACTIVE';
                  const roles = Array.isArray(u.roles)
                    ? u.roles.map((r) => (typeof r === 'object' ? (r.roleName || r.name || 'USER') : String(r))).join(', ')
                    : (u.role || 'USER');

                  return (
                    <tr key={uid}>
                      <td><code className={styles.codeBadge}>{String(uid).slice(0, 8)}</code></td>
                      <td><strong>{uName}</strong></td>
                      <td>{u.email || u.userName}</td>
                      <td>
                        <span className={styles.roleTag}>{roles}</span>
                      </td>
                      <td>
                        <span className={uStatus === 'ACTIVE' ? styles.badgeActive : styles.badgeSuspended}>
                          {uStatus}
                        </span>
                      </td>
                      <td>
                        {!roles.includes('ADMIN') && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(uid, uStatus)}
                            className={uStatus === 'ACTIVE' ? styles.btnSuspend : styles.btnActivate}
                          >
                            {uStatus === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </section>
      )}

      {/* Modal xác nhận kiểm duyệt */}
      {selectedVerifId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              Xác nhận {actionType === 'VERIFIED' ? 'DUYỆT' : 'TỪ CHỐI'} hồ sơ: {String(selectedVerifId).slice(0, 8)}
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
                disabled={reviewSubmitting}
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
                disabled={reviewSubmitting}
                onClick={confirmReview}
                className={actionType === 'VERIFIED' ? styles.btnApprove : styles.btnReject}
              >
                {reviewSubmitting ? 'Đang xử lý...' : `Xác nhận ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
