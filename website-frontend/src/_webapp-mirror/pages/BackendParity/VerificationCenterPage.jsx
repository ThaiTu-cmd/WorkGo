import { useTranslations } from "next-intl";
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
export default function VerificationCenterPage({
  onNavigate,
  onShowToast
}) {
  const tr = useTranslations("misc");
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
  const hasPending = verifications.some(v => (v.verificationStatus || v.status) === 'PENDING');
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
        setCurrentUser({
          name: tr("m224")
        });
      }
      const res = await verificationApi.getMy({
        page: 0,
        size: 50
      });
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
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (hasPending) {
      setError(tr("m319"));
      return;
    }
    const cleanNum = documentNumber.trim();
    if (!cleanNum || cleanNum.length < 8 || cleanNum.length > 20) {
      setError(tr("m320"));
      return;
    }
    if (documentUrl.trim() && !/^https?:\/\/.+/i.test(documentUrl.trim())) {
      setError(tr("m321"));
      return;
    }
    if (note.length > 500) {
      setError(tr("m322"));
      return;
    }
    setIsSubmitting(true);
    try {
      await verificationApi.submit({
        verificationType,
        documentType,
        documentNumber: cleanNum,
        documentUrl: documentUrl.trim() || undefined,
        note: note.trim() || undefined
      });

      // Reset form
      setDocumentNumber('');
      setDocumentUrl('');
      setNote('');
      await loadData();
      if (onShowToast) {
        onShowToast(tr("m323"));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-verification-changed'));
      }
    } catch (err) {
      setError(err?.message || tr("m324"));
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleWithdraw = async id => {
    setActionLoadingId(id);
    try {
      await verificationApi.remove(id);
      // Cập nhật trạng thái lạc quan ngay lập tức để mở lại form
      setVerifications(prev => prev.filter(v => (v.providerVerificationId || v.id) !== id));
      setError('');
      await loadData();
      if (onShowToast) {
        onShowToast(tr("m325"));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-verification-changed'));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(tr("m326", {
          p0: err?.message || tr("m1470")
        }));
      }
    } finally {
      setActionLoadingId(null);
    }
  };
  const navigateTo = page => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // Gate kiểm tra đăng nhập
  const token = getAccessToken();
  if (!token && !loading) {
    return <div className={styles.container}>
        <div className={styles.loginGateCard}>
          <div className={styles.gateIcon}>🔒</div>
          <h1 className={styles.gateTitle}>{tr("m341")}</h1>
          <p className={styles.gateDesc}>{tr("m342")}</p>
          <div className={styles.gateActions}>
            <button type="button" onClick={() => navigateTo('login')} className={styles.btnPrimary}>{tr("m27")}</button>
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
        <button type="button" onClick={() => navigateTo('provider-onboarding')} className={styles.breadcrumbLink}>{tr("m343")}</button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{tr("m344")}</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{tr("m345")}</h1>
        <p className={styles.subtitle}>{tr("m346")}</p>
      </header>

      <div className={styles.mainGrid}>
        {/* Form gửi hồ sơ mới */}
        <section className={styles.formSection}>
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>{tr("m348")}</h2>
            {hasPending && <div className={styles.alertWarning}>
                ⚠️ <strong>{tr("m349")}</strong>{tr("m350")}<em>{tr("m1482")}</em>{tr("m352")}</div>}
            {error && <div className={styles.alertError}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="verif-type" className={styles.label}>{tr("m353")}</label>
                <select id="verif-type" className={styles.select} value={verificationType} onChange={e => {
                const nextVal = e.target.value;
                setVerificationType(nextVal);
                if (nextVal === 'IDENTITY_CARD') setDocumentType('CCCD');else if (nextVal === 'BUSINESS_LICENSE') setDocumentType('DKKD');else if (nextVal === 'TAX_CODE') setDocumentType('MST');else if (nextVal === 'PROFESSIONAL_CERT') setDocumentType('CERT');
              }}>
                  <option value="IDENTITY_CARD">{tr("m354")}</option>
                  <option value="BUSINESS_LICENSE">{tr("m355")}</option>
                  <option value="TAX_CODE">{tr("m356")}</option>
                  <option value="PROFESSIONAL_CERT">{tr("m357")}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-type" className={styles.label}>{tr("m358")}</label>
                <select id="doc-type" className={styles.select} value={documentType} onChange={e => setDocumentType(e.target.value)}>
                  {verificationType === 'IDENTITY_CARD' ? <>
                      <option value="CCCD">{tr("m359")}</option>
                      <option value="PASSPORT">{tr("m360")}</option>
                    </> : verificationType === 'BUSINESS_LICENSE' ? <option value="DKKD">{tr("m361")}</option> : verificationType === 'TAX_CODE' ? <option value="MST">{tr("m362")}</option> : <option value="CERT">{tr("m363")}</option>}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-num" className={styles.label}>{tr("m364")}</label>
                <input id="doc-num" type="text" className={styles.input} placeholder={tr("m327")} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} required />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-url" className={styles.label}>{tr("m365")}</label>
                <input id="doc-url" type="url" className={styles.input} placeholder="https://example.com/anh-giay-to.jpg" value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} />
                <span className={styles.helpText}>{tr("m366")}</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="doc-note" className={styles.label}>{tr("m367")}</label>
                <textarea id="doc-note" rows={3} className={styles.textarea} placeholder={tr("m328")} value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
                <span className={styles.charCount}>{note.length}{tr("m1483")}</span>
              </div>

              <button type="submit" disabled={isSubmitting || hasPending} className={styles.btnPrimary} style={hasPending ? {
              opacity: 0.6,
              cursor: 'not-allowed'
            } : undefined}>
                {isSubmitting ? tr("m329") : hasPending ? tr("m330") : tr("m331")}
              </button>
            </form>
          </div>
        </section>

        {/* Danh sách hồ sơ đã gửi & Timeline */}
        <section className={styles.listSection}>
          <div className={styles.card}>
            <h2 className={styles.sectionHeading}>{tr("m371")}</h2>

            {loading ? <div className={styles.emptyState} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
                <Loader2 size={20} style={{
              animation: 'spin 1s linear infinite'
            }} />
                <p className={styles.emptyText}>{tr("m372")}</p>
              </div> : verifications.length === 0 ? <div className={styles.emptyState}>
                <p className={styles.emptyText}>{tr("m373")}</p>
                <span className={styles.emptySub}>{tr("m374")}</span>
              </div> : <div className={styles.verifList}>
                {verifications.map(item => {
              const id = item.providerVerificationId || item.id;
              const vStatus = item.verificationStatus || item.status;
              const isWithdrawing = actionLoadingId === id;
              return <div key={id} className={styles.verifItem}>
                      <div className={styles.verifHeader}>
                        <div className={styles.verifTypeInfo}>
                          <span className={styles.verifBadgeType}>
                            {item.verificationType === 'IDENTITY_CARD' ? tr("m226") : item.verificationType === 'BUSINESS_LICENSE' ? tr("m225") : item.verificationType === 'TAX_CODE' ? tr("m332") : tr("m333")}
                          </span>
                          <strong className={styles.verifDocTitle}>
                            {item.documentType}: {item.documentNumber || id.slice(0, 8)}
                          </strong>
                        </div>

                        {/* Trạng thái duyệt */}
                        <span className={vStatus === 'VERIFIED' ? styles.statusVerified : vStatus === 'REJECTED' ? styles.statusRejected : styles.statusPending}>
                          {vStatus === 'VERIFIED' && tr("m334")}
                          {vStatus === 'REJECTED' && tr("m335")}
                          {vStatus === 'PENDING' && tr("m336")}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className={styles.timeline}>
                        <div className={styles.timelineRow}>
                          <span className={styles.timelineLabel}>{tr("m378")}</span>
                          <span className={styles.timelineVal}>
                            {item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
                          </span>
                        </div>
                        {item.verifiedAt && <div className={styles.timelineRow}>
                            <span className={styles.timelineLabel}>{tr("m379")}</span>
                            <span className={styles.timelineVal}>
                              {new Date(item.verifiedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>}
                        {item.reviewerNote && <div className={styles.timelineRow}>
                            <span className={styles.timelineLabel}>{tr("m380")}</span>
                            <span className={styles.reviewerNote}>{item.reviewerNote}</span>
                          </div>}
                      </div>

                      {/* Nút hành động cho hồ sơ PENDING */}
                      {vStatus === 'PENDING' && <div className={styles.itemActions}>
                          <button type="button" disabled={isWithdrawing} onClick={() => handleWithdraw(id)} className={styles.btnWithdraw}>
                            {isWithdrawing ? tr("m337") : tr("m338")}
                          </button>
                        </div>}
                    </div>;
            })}
              </div>}
          </div>
        </section>
      </div>
    </div>;
}