import { useTranslations } from "next-intl";
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
export default function AdminConsolePage({
  onNavigate,
  onShowToast
}) {
  const tr = useTranslations("misc");
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
        const [pPending, pVerified, pSuspended] = await Promise.allSettled([adminApi.listProviders({
          status: 'PENDING',
          page: 0,
          size: 50
        }), adminApi.listProviders({
          status: 'VERIFIED',
          page: 0,
          size: 50
        }), adminApi.listProviders({
          status: 'SUSPENDED',
          page: 0,
          size: 50
        })]);
        const all = [];
        if (pPending.status === 'fulfilled') all.push(...(pPending.value?.result?.data || []));
        if (pVerified.status === 'fulfilled') all.push(...(pVerified.value?.result?.data || []));
        if (pSuspended.status === 'fulfilled') all.push(...(pSuspended.value?.result?.data || []));
        setProviders(all);
      } else {
        const res = await adminApi.listProviders({
          status,
          page: 0,
          size: 50
        });
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
      const user = myInfoRes?.result || {
        name: 'Admin WorkGo',
        email: 'admin@workgo.vn',
        role: 'ADMIN'
      };
      setUserState(user);

      // Tải verifications, users, providers, categories
      const [verifRes, usersRes, provRes, catRes] = await Promise.allSettled([adminApi.listVerifications({
        status: 'PENDING',
        page: 0,
        size: 50
      }), adminApi.listUsers({
        page: 0,
        size: 50
      }), adminApi.listProviders({
        status: 'VERIFIED',
        page: 0,
        size: 50
      }), adminApi.listCategories({
        page: 0,
        size: 50
      })]);
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
    setReviewNote(status === 'VERIFIED' ? tr("m213") : tr("m214"));
  };
  const confirmReview = async () => {
    if (!selectedVerifId || !actionType || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      await adminApi.reviewVerification(selectedVerifId, actionType);
      await loadData();
      if (onShowToast) {
        onShowToast(tr("m1450", {
          p0: actionType === 'VERIFIED' ? tr("m1469") : tr("m643"),
          p1: selectedVerifId
        }));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-verification-changed'));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(tr("m216", {
          p0: err?.message || tr("m1470")
        }));
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
      await adminApi.updateUser(userId, {
        status: newStatus
      });
      await loadData();
      if (onShowToast) {
        onShowToast(tr("m217", {
          p0: newStatus
        }));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(tr("m218", {
          p0: err?.message || tr("m1470")
        }));
      }
    }
  };
  const handleSetProviderStatus = async (providerId, status) => {
    setActionLoadingProviderId(providerId);
    try {
      await adminApi.setProviderStatus(providerId, status);
      if (onShowToast) {
        onShowToast(tr("m219", {
          p0: status
        }));
      }
      await loadProviders(providerFilter);
    } catch (err) {
      if (onShowToast) {
        onShowToast(tr("m220", {
          p0: err?.message || tr("m1470")
        }));
      }
    } finally {
      setActionLoadingProviderId(null);
    }
  };
  const navigateTo = page => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // GATE BẢO MẬT: Bắt buộc tài khoản có quyền ADMIN
  if (!isAdmin && !loading) {
    return <div className={styles.container}>
        <div className={styles.unauthorizedCard}>
          <div className={styles.unauthorizedIcon}>🚫</div>
          <h1 className={styles.unauthorizedTitle}>{tr("m238")}</h1>
          <p className={styles.unauthorizedDesc}>{tr("m239")}</p>
          <div className={styles.unauthorizedActions}>
            <button type="button" onClick={() => navigateTo('login')} className={styles.btnPrimary}>{tr("m240")}</button>
            <button type="button" onClick={() => navigateTo('home')} className={styles.btnSecondary}>{tr("m241")}</button>
          </div>
        </div>
      </div>;
  }
  return <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button type="button" onClick={() => navigateTo('home')} className={styles.breadcrumbLink}>{tr("m242")}</button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{tr("m243")}</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{tr("m244")}</h1>
          <p className={styles.subtitle}>{tr("m245")}<strong>{currentUser?.name || 'Admin'}</strong> ({currentUser?.email || 'admin@workgo.vn'}{tr("m1471")}<span className={styles.badgeRole}>{tr("m247")}</span>
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button type="button" onClick={() => setActiveTab('verifications')} className={`${styles.tabBtn} ${activeTab === 'verifications' ? styles.tabBtnActive : ''}`}>{tr("m1472")}{verifications.length})
        </button>
        <button type="button" onClick={() => {
        setActiveTab('providers');
        loadProviders(providerFilter);
      }} className={`${styles.tabBtn} ${activeTab === 'providers' ? styles.tabBtnActive : ''}`}>{tr("m1473")}{providers.length})
        </button>
        <button type="button" onClick={() => setActiveTab('categories')} className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}>{tr("m1474")}{categories.length})
        </button>
        <button type="button" onClick={() => setActiveTab('users')} className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}>{tr("m1475")}{users.length})
        </button>
      </div>

      {loading && <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      gap: '8px'
    }}>
          <Loader2 size={24} style={{
        animation: 'spin 1s linear infinite'
      }} />
          <span>{tr("m252")}</span>
        </div>}

      {/* Tab 1: Verification Queue */}
      {!loading && activeTab === 'verifications' && <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{tr("m253")}</h2>

          {verifications.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--wg-text-muted)'
      }}>
              <div style={{
          fontSize: '2.5rem',
          marginBottom: '8px'
        }}>📋</div>
              <p style={{
          fontWeight: 600,
          color: 'var(--wg-text-secondary)',
          fontSize: '1rem',
          margin: '0 0 4px 0'
        }}>{tr("m254")}</p>
              <span style={{
          fontSize: '0.85rem'
        }}>{tr("m255")}</span>
            </div> : <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{tr("m256")}</th>
                    <th>{tr("m60")}</th>
                    <th>{tr("m1476")}</th>
                    <th>{tr("m258")}</th>
                    <th>{tr("m259")}</th>
                    <th>{tr("m260")}</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(v => {
              const id = v.providerVerificationId || v.id;
              const vStatus = v.verificationStatus || v.status;
              const submitted = v.submittedAt || v.createdAt;
              return <tr key={id}>
                        <td><code className={styles.codeBadge}>{String(id).slice(0, 8)}</code></td>
                        <td>
                          <div className={styles.userCell}>
                            <strong>{v.userName || v.providerProfileId || tr("m60")}</strong>
                            <span className={styles.userEmail}>{v.userEmail || ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.docInfo}>
                            {v.verificationType} • {v.documentType}: {v.documentNumber || id.slice(0, 8)}
                          </span>
                          {v.documentUrl && <div className={styles.linkWrap}>
                              <a href={v.documentUrl} target="_blank" rel="noreferrer noopener" className={styles.docLink}>{tr("m262")}</a>
                            </div>}
                        </td>
                        <td>{submitted ? new Date(submitted).toLocaleDateString('vi-VN') : '—'}</td>
                        <td>
                          <span className={vStatus === 'VERIFIED' ? styles.badgeVerified : vStatus === 'REJECTED' ? styles.badgeRejected : styles.badgePending}>
                            {vStatus}
                          </span>
                        </td>
                        <td>
                          {vStatus === 'PENDING' ? <div className={styles.actionButtonGroup}>
                              <button type="button" onClick={() => handleReview(id, 'VERIFIED')} className={styles.btnApprove}>{tr("m263")}</button>
                              <button type="button" onClick={() => handleReview(id, 'REJECTED')} className={styles.btnReject}>{tr("m264")}</button>
                            </div> : <span className={styles.reviewedText}>{tr("m1477")}{v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString('vi-VN') : '—'}
                            </span>}
                        </td>
                      </tr>;
            })}
                </tbody>
              </table>
            </div>}
        </section>}

      {/* Tab: Provider Management */}
      {!loading && activeTab === 'providers' && <section className={styles.sectionCard}>
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
            <h2 className={styles.sectionTitle} style={{
          margin: 0
        }}>{tr("m266")}</h2>
            <div className={styles.filterRow} style={{
          margin: 0
        }}>
              {['ALL', 'VERIFIED', 'PENDING', 'SUSPENDED'].map(st => <button key={st} type="button" onClick={() => {
            setProviderFilter(st);
            loadProviders(st);
          }} className={`${styles.filterBtn} ${providerFilter === st ? styles.filterBtnActive : ''}`}>
                  {st === 'ALL' ? tr("m142") : st === 'VERIFIED' ? tr("m221") : st === 'PENDING' ? tr("m222") : tr("m223")}
                </button>)}
            </div>
          </div>

          {providers.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--wg-text-muted)'
      }}>
              <div style={{
          fontSize: '2.5rem',
          marginBottom: '8px'
        }}>💼</div>
              <p style={{
          fontWeight: 600,
          color: 'var(--wg-text-secondary)',
          fontSize: '1rem',
          margin: '0 0 4px 0'
        }}>{tr("m268")}</p>
              <span style={{
          fontSize: '0.85rem'
        }}>{tr("m269")}</span>
            </div> : <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{tr("m270")}</th>
                    <th>{tr("m271")}</th>
                    <th>{tr("m272")}</th>
                    <th>{tr("m273")}</th>
                    <th>{tr("m274")}</th>
                    <th>{tr("m259")}</th>
                    <th>{tr("m260")}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => {
              const pid = p.providerProfileId || p.id;
              const pStatus = p.verificationStatus || p.status || 'PENDING';
              const isBusy = actionLoadingProviderId === pid;
              return <tr key={pid}>
                        <td><code className={styles.codeBadge}>{String(pid).slice(0, 8)}</code></td>
                        <td>
                          <strong>{p.businessName || tr("m224")}</strong>
                        </td>
                        <td>
                          <span className={p.providerType === 'BUSINESS' ? styles.badgeBusiness : styles.badgeIndividual}>
                            {p.providerType === 'BUSINESS' ? tr("m225") : tr("m226")}
                          </span>
                        </td>
                        <td style={{
                  maxWidth: '240px',
                  fontSize: '0.82rem',
                  color: 'var(--wg-text-secondary)'
                }}>
                          {p.bio || '—'}
                        </td>
                        <td>
                          <span style={{
                    fontSize: '0.85rem'
                  }}>
                            {p.completedOrderCount ?? 0}{tr("m1478")}{p.ratingAvg ?? 5.0} ({p.ratingCount ?? 0})
                          </span>
                        </td>
                        <td>
                          <span className={pStatus === 'VERIFIED' ? styles.badgeVerified : pStatus === 'SUSPENDED' ? styles.badgeSuspended : styles.badgePending}>
                            {pStatus}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtonGroup}>
                            {pStatus !== 'VERIFIED' && <button type="button" disabled={isBusy} onClick={() => handleSetProviderStatus(pid, 'VERIFIED')} className={styles.btnApprove}>
                                {isBusy ? '...' : tr("m227")}
                              </button>}
                            {pStatus !== 'SUSPENDED' && <button type="button" disabled={isBusy} onClick={() => handleSetProviderStatus(pid, 'SUSPENDED')} className={styles.btnSuspend}>
                                {isBusy ? '...' : tr("m228")}
                              </button>}
                          </div>
                        </td>
                      </tr>;
            })}
                </tbody>
              </table>
            </div>}
        </section>}

      {/* Tab: Category Management */}
      {!loading && activeTab === 'categories' && <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{tr("m280")}</h2>
          {categories.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--wg-text-muted)'
      }}>
              <div style={{
          fontSize: '2.5rem',
          marginBottom: '8px'
        }}>🗂️</div>
              <p style={{
          fontWeight: 600,
          color: 'var(--wg-text-secondary)',
          fontSize: '1rem',
          margin: '0 0 4px 0'
        }}>{tr("m281")}</p>
              <span style={{
          fontSize: '0.85rem'
        }}>{tr("m282")}</span>
            </div> : <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{tr("m283")}</th>
                    <th>{tr("m284")}</th>
                    <th>{tr("m285")}</th>
                    <th>{tr("m286")}</th>
                    <th>{tr("m287")}</th>
                    <th>{tr("m288")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => {
              const cid = c.categoryId || c.id;
              return <tr key={cid}>
                        <td><code className={styles.codeBadge}>{String(cid).slice(0, 8)}</code></td>
                        <td><strong>{c.name}</strong></td>
                        <td><code style={{
                    fontSize: '0.8rem',
                    color: 'var(--wg-text-muted)'
                  }}>{c.slug}</code></td>
                        <td style={{
                  maxWidth: '280px',
                  fontSize: '0.82rem',
                  color: 'var(--wg-text-secondary)'
                }}>
                          {c.description || '—'}
                        </td>
                        <td>
                          <span className={styles.roleTag}>
                            {c.parent ? c.parent.name || String(c.parent.categoryId || c.parent).slice(0, 8) : tr("m229")}
                          </span>
                        </td>
                        <td>
                          <span style={{
                    fontSize: '0.85rem',
                    color: 'var(--wg-text-secondary)'
                  }}>
                            {Array.isArray(c.children) ? tr("m230", {
                      p0: c.children.length
                    }) : '0'}
                          </span>
                        </td>
                      </tr>;
            })}
                </tbody>
              </table>
            </div>}
        </section>}

      {/* Tab 2: User Management */}
      {!loading && activeTab === 'users' && <section className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{tr("m291")}</h2>
          {users.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--wg-text-muted)'
      }}>
              <div style={{
          fontSize: '2.5rem',
          marginBottom: '8px'
        }}>👥</div>
              <p style={{
          fontWeight: 600,
          color: 'var(--wg-text-secondary)',
          fontSize: '1rem',
          margin: '0 0 4px 0'
        }}>{tr("m292")}</p>
              <span style={{
          fontSize: '0.85rem'
        }}>{tr("m293")}</span>
            </div> : <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tr("m294")}</th>
                  <th>{tr("m295")}</th>
                  <th>Username / Email</th>
                  <th>{tr("m296")}</th>
                  <th>{tr("m259")}</th>
                  <th>{tr("m260")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
              const uid = u.userId || u.id;
              const uName = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || tr("m231");
              const uStatus = u.status || 'ACTIVE';
              const roles = Array.isArray(u.roles) ? u.roles.map(r => typeof r === 'object' ? r.roleName || r.name || 'USER' : String(r)).join(', ') : u.role || 'USER';
              return <tr key={uid}>
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
                        {!roles.includes('ADMIN') && <button type="button" onClick={() => handleToggleUserStatus(uid, uStatus)} className={uStatus === 'ACTIVE' ? styles.btnSuspend : styles.btnActivate}>
                            {uStatus === 'ACTIVE' ? tr("m232") : tr("m233")}
                          </button>}
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>}
        </section>}

      {/* Modal xác nhận kiểm duyệt */}
      {selectedVerifId && <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>{tr("m880")}{actionType === 'VERIFIED' ? tr("m234") : tr("m235")}{tr("m1479")}{String(selectedVerifId).slice(0, 8)}
            </h3>
            <p className={styles.modalDesc}>{tr("m300")}</p>
            <textarea rows={3} className={styles.modalTextarea} value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            <div className={styles.modalActions}>
              <button type="button" disabled={reviewSubmitting} onClick={() => {
            setSelectedVerifId(null);
            setActionType(null);
          }} className={styles.btnSecondary}>{tr("m301")}</button>
              <button type="button" disabled={reviewSubmitting} onClick={confirmReview} className={actionType === 'VERIFIED' ? styles.btnApprove : styles.btnReject}>
                {reviewSubmitting ? tr("m26") : tr("m236", {
              p0: actionType
            })}
              </button>
            </div>
          </div>
        </div>}
    </div>;
}