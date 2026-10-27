import React, { useEffect, useRef, useState } from 'react';
import { PUBLIC_INFO } from './publicInfoContent.js';
import styles from './PublicInfoPage.module.css';

/**
 * PublicInfoPage: Renderer duy nhất cho 12 trang nội dung công khai của WorkGo.
 * Không gọi API backend, độc lập hoàn toàn, hỗ trợ a11y focus heading và localStorage an toàn SSR.
 */
export default function PublicInfoPage({ pageKey = 'how-it-works', onNavigate, onShowToast }) {
  const content = PUBLIC_INFO[pageKey] || PUBLIC_INFO['how-it-works'];
  const headingRef = useRef(null);

  // Cuộn trang lên đầu khi chuyển sang trang thông tin công khai
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pageKey]);

  // State riêng cho Contact Form
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    topic: content?.topics?.[0] || 'Tư vấn đặt dịch vụ',
    message: '',
  });
  const [contactSuccessTicket, setContactSuccessTicket] = useState(null);
  const [contactError, setContactError] = useState('');

  // State riêng cho Careers Modal/Applied
  const [appliedRoles, setAppliedRoles] = useState({});

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactError('');

    if (!contactForm.name.trim()) {
      setContactError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!contactForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      setContactError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!contactForm.message.trim()) {
      setContactError('Vui lòng nhập nội dung tin nhắn cần hỗ trợ.');
      return;
    }

    const ticketId = `WG-${Date.now()}`;
    const newRequest = {
      id: ticketId,
      ...contactForm,
      createdAt: new Date().toISOString(),
      status: 'RECEIVED',
    };

    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('workgo_contact_requests') || '[]');
        existing.unshift(newRequest);
        localStorage.setItem('workgo_contact_requests', JSON.stringify(existing));
      } catch (_err) {
        // quota safe
      }
    }

    setContactSuccessTicket(ticketId);
    if (onShowToast) {
      onShowToast(`Gửi yêu cầu hỗ trợ thành công! Mã vé: ${ticketId}`);
    }
  };

  const handleApplyCareer = (role) => {
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('workgo_job_applications') || '[]');
        existing.unshift({
          roleId: role.id,
          roleTitle: role.title,
          appliedAt: new Date().toISOString(),
        });
        localStorage.setItem('workgo_job_applications', JSON.stringify(existing));
      } catch (_err) {
        // quota safe
      }
    }

    setAppliedRoles((prev) => ({ ...prev, [role.id]: true }));
    if (onShowToast) {
      onShowToast(`Đã ghi nhận hồ sơ ứng tuyển vị trí: ${role.title}!`);
    }
  };

  const navigateTo = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    }
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb điều hướng */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={styles.breadcrumbLink}
        >
          Trang chủ
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{content.title}</span>
      </nav>

      {/* Header trang */}
      <header className={styles.header}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={styles.title}
        >
          {content.title}
        </h1>
        {content.subtitle && <p className={styles.subtitle}>{content.subtitle}</p>}
        {content.updatedAt && (
          <div className={styles.metaRow}>
            <span className={styles.updatedAt}>Cập nhật lần cuối: {content.updatedAt}</span>
          </div>
        )}
      </header>

      {/* Nội dung theo từng loại trang (kind) */}
      <main className={styles.contentBody}>
        {/* 1. Loại ARTICLE (Mặc định cho hướng dẫn, quy định, điều khoản) */}
        {content.kind === 'article' && (
          <div className={styles.articleLayout}>
            {content.sections?.map((sec, idx) => (
              <section key={idx} className={styles.section}>
                <h2 className={styles.sectionHeading}>{sec.heading}</h2>
                {sec.body?.map((pText, pIdx) => (
                  <p key={pIdx} className={styles.paragraph}>{pText}</p>
                ))}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className={styles.bulletList}>
                    {sec.bullets.map((bText, bIdx) => (
                      <li key={bIdx} className={styles.bulletItem}>{bText}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* CTA đặc thù của article nếu có */}
            {content.ctas && content.ctas.length > 0 && (
              <div className={styles.ctaRow}>
                {content.ctas.map((cta, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => navigateTo(cta.page)}
                    className={cta.variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}
                  >
                    {cta.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Loại FAQ (Hỏi đáp với native accordion <details>) */}
        {content.kind === 'faq' && (
          <div className={styles.faqLayout}>
            {content.groups?.map((grp, gIdx) => (
              <div key={gIdx} className={styles.faqGroup}>
                <h2 className={styles.faqGroupHeading}>{grp.heading}</h2>
                <div className={styles.accordionList}>
                  {grp.items?.map((item, iIdx) => (
                    <details key={iIdx} className={styles.faqDetails}>
                      <summary className={styles.faqSummary}>{item.q}</summary>
                      <div className={styles.faqAnswer}>
                        <p>{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Loại CONTACT (Form liên hệ + kênh trực tiếp) */}
        {content.kind === 'contact' && (
          <div className={styles.contactLayout}>
            <div className={styles.contactGrid}>
              {/* Form gửi yêu cầu */}
              <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Gửi yêu cầu trực tuyến</h2>
                {contactSuccessTicket ? (
                  <div className={styles.successBox}>
                    <div className={styles.successBadge}>✓ Đã ghi nhận</div>
                    <p className={styles.successTitle}>Yêu cầu hỗ trợ đã được tạo thành công!</p>
                    <p className={styles.successTicket}>Mã phiếu: <strong>{contactSuccessTicket}</strong></p>
                    <p className={styles.successDesc}>
                      Đội ngũ chăm sóc khách hàng của WorkGo sẽ phản hồi qua email của bạn trong vòng tối đa 2 giờ làm việc.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setContactSuccessTicket(null);
                        setContactForm({
                          name: '',
                          email: '',
                          topic: content?.topics?.[0] || 'Tư vấn đặt dịch vụ',
                          message: '',
                        });
                      }}
                      className={styles.btnSecondary}
                    >
                      Gửi thêm yêu cầu khác
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className={styles.form}>
                    {contactError && <div className={styles.formError}>{contactError}</div>}
                    <div className={styles.formGroup}>
                      <label htmlFor="contact-name" className={styles.label}>Họ và tên *</label>
                      <input
                        id="contact-name"
                        type="text"
                        className={styles.input}
                        placeholder="Nguyễn Văn A"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="contact-email" className={styles.label}>Địa chỉ Email *</label>
                      <input
                        id="contact-email"
                        type="email"
                        className={styles.input}
                        placeholder="example@workgo.vn"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="contact-topic" className={styles.label}>Chủ đề cần hỗ trợ *</label>
                      <select
                        id="contact-topic"
                        className={styles.select}
                        value={contactForm.topic}
                        onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                      >
                        {content.topics?.map((top, tIdx) => (
                          <option key={tIdx} value={top}>{top}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="contact-message" className={styles.label}>Nội dung chi tiết *</label>
                      <textarea
                        id="contact-message"
                        rows={4}
                        className={styles.textarea}
                        placeholder="Mô tả cụ thể vấn đề hoặc mã đơn hàng bạn đang cần hỗ trợ..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>

                    <button type="submit" className={styles.btnPrimary}>
                      Gửi yêu cầu ngay
                    </button>
                  </form>
                )}
              </div>

              {/* Kênh hỗ trợ trực tiếp */}
              <div className={styles.channelCol}>
                <h2 className={styles.formTitle}>Kênh hỗ trợ chính thức</h2>
                <div className={styles.channelCards}>
                  {content.channels?.map((chan, cIdx) => (
                    <div key={cIdx} className={styles.channelCard}>
                      <div className={styles.channelIcon}>{chan.icon}</div>
                      <div>
                        <h3 className={styles.channelLabel}>{chan.label}</h3>
                        <p className={styles.channelValue}>{chan.value}</p>
                        <p className={styles.channelSub}>{chan.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.quickLinks}>
                  <h3 className={styles.quickTitle}>Liên kết nhanh hữu ích</h3>
                  <button type="button" onClick={() => navigateTo('faq')} className={styles.quickBtn}>
                    Câu hỏi thường gặp (FAQ) →
                  </button>
                  <button type="button" onClick={() => navigateTo('refund-policy')} className={styles.quickBtn}>
                    Chính sách hoàn tiền & ký quỹ →
                  </button>
                  <button type="button" onClick={() => navigateTo('terms')} className={styles.quickBtn}>
                    Điều khoản sử dụng nền tảng →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Loại CAREERS (Cơ hội việc làm) */}
        {content.kind === 'careers' && (
          <div className={styles.careersLayout}>
            {content.values && (
              <div className={styles.valuesGrid}>
                {content.values.map((v, vIdx) => (
                  <div key={vIdx} className={styles.valueCard}>
                    <h3 className={styles.valueHeading}>{v.title}</h3>
                    <p className={styles.valueDesc}>{v.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <h2 className={styles.careersHeading}>Vị trí đang mở tuyển dụng</h2>
            <div className={styles.rolesList}>
              {content.roles?.map((role) => (
                <div key={role.id} className={styles.roleCard}>
                  <div className={styles.roleHeader}>
                    <div>
                      <h3 className={styles.roleTitle}>{role.title}</h3>
                      <div className={styles.roleMeta}>
                        <span className={styles.roleBadge}>{role.type}</span>
                        <span className={styles.roleBadge}>{role.location}</span>
                        <span className={styles.roleSalary}>{role.salary}</span>
                      </div>
                    </div>
                    <div>
                      {appliedRoles[role.id] ? (
                        <button type="button" disabled className={styles.btnApplied}>
                          ✓ Đã nộp hồ sơ
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyCareer(role)}
                          className={styles.btnPrimary}
                        >
                          Ứng tuyển nhanh
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={styles.roleSummary}>{role.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Loại COMMUNITY (Cộng đồng) */}
        {content.kind === 'community' && (
          <div className={styles.communityLayout}>
            <div className={styles.communityGrid}>
              {content.cards?.map((card, cIdx) => (
                <div key={cIdx} className={styles.communityCard}>
                  <h3 className={styles.communityCardTitle}>{card.title}</h3>
                  <p className={styles.communityCardDesc}>{card.desc}</p>
                  <button
                    type="button"
                    onClick={() => navigateTo(card.page)}
                    className={styles.btnSecondary}
                  >
                    {card.label} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer cho trang pháp lý */}
        {content.disclaimer && (
          <div className={styles.disclaimerBox}>
            <p className={styles.disclaimerText}>{content.disclaimer}</p>
          </div>
        )}
      </main>

      {/* Điều hướng chân trang phụ trợ */}
      <footer className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <span className={styles.bottomNavText}>Cần tìm thêm thông tin khác?</span>
          <div className={styles.bottomNavActions}>
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={styles.btnSecondary}
            >
              Về Trang chủ
            </button>
            <button
              type="button"
              onClick={() => navigateTo('catalog')}
              className={styles.btnPrimary}
            >
              Khám phá dịch vụ
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
