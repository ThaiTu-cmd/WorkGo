"use client";

// chế độ demo
import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";
import { PUBLIC_INFO, PUBLIC_INFO_PAGE_KEYS } from "./publicInfoContent.js";
import styles from "./PublicInfoPage.module.css";
export type PublicInfoPageKey = (typeof PUBLIC_INFO_PAGE_KEYS)[number];
export function isPublicInfoPageKey(key: string): key is PublicInfoPageKey {
  return (PUBLIC_INFO_PAGE_KEYS as readonly string[]).includes(key);
}
interface ArticleSection {
  heading: string;
  body: string[];
  bullets?: string[];
}
interface ArticleCTA {
  label: string;
  page: string;
  variant: "primary" | "outline";
}
interface FAQItem {
  q: string;
  a: string;
}
interface FAQGroup {
  heading: string;
  items: FAQItem[];
}
interface ChannelItem {
  title: string;
  value: string;
  note: string;
}
interface CareerRole {
  id: string;
  title: string;
  location: string;
  type: string;
  salary?: string;
  summary: string;
}
interface CareerValue {
  title: string;
  desc: string;
}
interface CommunityCard {
  title: string;
  desc: string;
  label: string;
  page: string;
}
interface PageContent {
  title: string;
  subtitle?: string;
  kind: "article" | "faq" | "contact" | "careers" | "community";
  updatedAt?: string;
  disclaimer?: string;
  sections?: ArticleSection[];
  ctas?: ArticleCTA[];
  groups?: FAQGroup[];
  channels?: ChannelItem[];
  topics?: string[];
  roles?: CareerRole[];
  values?: CareerValue[];
  cards?: CommunityCard[];
}
const PUBLIC_INFO_TYPED = PUBLIC_INFO as unknown as Record<string, PageContent>;
interface Props {
  pageKey: PublicInfoPageKey;
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
  onShowToast?: (msg: string) => void;
}
interface ContactRequest {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  status: string;
}
interface JobApplication {
  roleId: string;
  roleTitle: string;
  appliedAt: string;
}
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>?/gm, "").trim();
}
export default function PublicInfoPage({
  pageKey,
  onNavigate,
  onShowToast
}: Props) {
  const tr = useTranslations("misc");
  const content = PUBLIC_INFO_TYPED[pageKey] || PUBLIC_INFO_TYPED["how-it-works"];
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Focus H1 without scrolling on pageKey change
  useEffect(() => {
    headingRef.current?.focus({
      preventScroll: true
    });
  }, [pageKey]);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    topic: content?.topics?.[0] || tr("m1383"),
    message: ""
  });
  const [contactErrors, setContactErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [contactSuccessTicket, setContactSuccessTicket] = useState<string | null>(null);

  // Careers Applied State
  const [appliedRoles, setAppliedRoles] = useState<Record<string, boolean>>({});

  // Reset contact form when page changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContactForm({
      name: "",
      email: "",
      topic: content?.topics?.[0] || tr("m1383"),
      message: ""
    });
    setContactErrors({});
    setContactSuccessTicket(null);
  }, [pageKey, content]);

  // Sync applied careers safely from localStorage in effect (avoid SSR mismatch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("workgo_job_applications");
        if (raw) {
          const list: JobApplication[] = JSON.parse(raw);
          if (Array.isArray(list)) {
            const map: Record<string, boolean> = {};
            for (const item of list) {
              if (item?.roleId) map[item.roleId] = true;
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAppliedRoles(map);
          }
        }
      } catch {
        // storage disabled or invalid
      }
    }
  }, []);
  const navigateTo = (target: string, params?: Record<string, unknown>) => {
    if (typeof onNavigate === "function") {
      onNavigate(target, params);
    }
  };
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = stripHtml(contactForm.name);
    const cleanEmail = stripHtml(contactForm.email);
    const cleanMessage = stripHtml(contactForm.message);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors: {
      name?: string;
      email?: string;
      message?: string;
    } = {};
    if (cleanName.length < 2 || cleanName.length > 80) {
      errors.name = tr("m1384");
    }
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 120) {
      errors.email = tr("m1385");
    }
    if (cleanMessage.length < 10 || cleanMessage.length > 1000) {
      errors.message = tr("m1386");
    }
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }
    setContactErrors({});
    const ticketId = `WG-${Date.now().toString().slice(-6)}`;
    const newRequest: ContactRequest = {
      id: ticketId,
      name: cleanName,
      email: cleanEmail,
      topic: contactForm.topic,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      status: "RECEIVED"
    };
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("workgo_contact_requests");
        const existing: ContactRequest[] = raw ? JSON.parse(raw) : [];
        existing.unshift(newRequest);
        if (existing.length > 50) {
          existing.length = 50;
        }
        localStorage.setItem("workgo_contact_requests", JSON.stringify(existing));
      } catch {
        if (onShowToast) {
          onShowToast(tr("m1387"));
        }
      }
    }
    setContactSuccessTicket(ticketId);
    if (onShowToast) {
      onShowToast(tr("m889", {
        p0: ticketId
      }));
    }
  };
  const handleApplyCareer = (role: {
    id: string;
    title: string;
  }) => {
    if (appliedRoles[role.id]) return;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("workgo_job_applications");
        const existing: JobApplication[] = raw ? JSON.parse(raw) : [];
        if (!existing.some(r => r.roleId === role.id)) {
          existing.unshift({
            roleId: role.id,
            roleTitle: role.title,
            appliedAt: new Date().toISOString()
          });
          localStorage.setItem("workgo_job_applications", JSON.stringify(existing));
        }
      } catch {
        if (onShowToast) {
          onShowToast(tr("m1387"));
        }
      }
    }
    setAppliedRoles(prev => ({
      ...prev,
      [role.id]: true
    }));
    if (onShowToast) {
      onShowToast(tr("m890", {
        p0: role.title
      }));
    }
  };
  return <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button type="button" onClick={() => navigateTo("home")} className={styles.breadcrumbLink}>{tr("m242")}</button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{content.title}</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          {content.title}
        </h1>
        {content.subtitle && <p className={styles.subtitle}>{content.subtitle}</p>}
        {content.updatedAt && <div className={styles.metaRow}>
            <span className={styles.updatedAt}>{tr("m1540")}{content.updatedAt}</span>
          </div>}
      </header>

      {/* Main Content Body */}
      <main className={styles.contentBody}>
        {/* Kind: ARTICLE */}
        {content.kind === "article" && <div className={styles.articleLayout}>
            {content.sections?.map((sec: ArticleSection, idx: number) => <section key={idx} className={styles.section}>
                <h2 className={styles.sectionHeading}>{sec.heading}</h2>
                {sec.body?.map((pText: string, pIdx: number) => <p key={pIdx} className={styles.paragraph}>{pText}</p>)}
                {sec.bullets && <ul className={styles.bulletList}>
                    {sec.bullets.map((bText: string, bIdx: number) => <li key={bIdx} className={styles.bulletItem}>{bText}</li>)}
                  </ul>}
              </section>)}

            {content.ctas && <div className={styles.ctaRow}>
                {content.ctas.map((cta: ArticleCTA, idx: number) => <button key={idx} type="button" onClick={() => navigateTo(cta.page)} className={cta.variant === "primary" ? styles.btnPrimary : styles.btnSecondary}>
                    {cta.label}
                  </button>)}
              </div>}
          </div>}

        {/* Kind: FAQ */}
        {content.kind === "faq" && <div className={styles.faqLayout}>
            {content.groups?.map((grp: FAQGroup, gIdx: number) => <div key={gIdx} className={styles.faqGroup}>
                <h2 className={styles.faqGroupHeading}>{grp.heading}</h2>
                <div className={styles.accordionList}>
                  {grp.items?.map((item: FAQItem, iIdx: number) => <details key={iIdx} className={styles.faqDetails}>
                      <summary className={styles.faqSummary}>{item.q}</summary>
                      <div className={styles.faqAnswer}>
                        <p>{item.a}</p>
                      </div>
                    </details>)}
                </div>
              </div>)}
          </div>}

        {/* Kind: CONTACT */}
        {content.kind === "contact" && <div className={styles.contactLayout}>
            <div className={styles.contactGrid}>
              {/* Form Card */}
              <div className={styles.formCard}>
                <h2 className={styles.formTitle}>{tr("m1393")}</h2>
                {contactSuccessTicket ? <div className={styles.successBox}>
                    <span className={styles.successBadge}>{tr("m900")}</span>
                    <h3 className={styles.successTitle}>{tr("m1394")}</h3>
                    <p className={styles.successDesc}>{tr("m1395")}<strong className={styles.ticketHighlight}>{contactSuccessTicket}</strong>
                      <br />{tr("m1396")}</p>
                    <button type="button" onClick={() => {
                setContactSuccessTicket(null);
                setContactForm({
                  name: "",
                  email: "",
                  topic: content?.topics?.[0] || tr("m1383"),
                  message: ""
                });
              }} className={styles.btnSecondary}>{tr("m904")}</button>
                  </div> : <form onSubmit={handleContactSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                      <label htmlFor="wg-contact-name" className={styles.label}>{tr("m905")}</label>
                      <input id="wg-contact-name" type="text" value={contactForm.name} onChange={e => setContactForm(prev => ({
                  ...prev,
                  name: e.target.value
                }))} placeholder={tr("m1388")} className={styles.input} />
                      {contactErrors.name && <div className={styles.formError}>{contactErrors.name}</div>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="wg-contact-email" className={styles.label}>{tr("m906")}</label>
                      <input id="wg-contact-email" type="email" value={contactForm.email} onChange={e => setContactForm(prev => ({
                  ...prev,
                  email: e.target.value
                }))} placeholder="email@example.com" className={styles.input} />
                      {contactErrors.email && <div className={styles.formError}>{contactErrors.email}</div>}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="wg-contact-topic" className={styles.label}>{tr("m1397")}</label>
                      <select id="wg-contact-topic" value={contactForm.topic} onChange={e => setContactForm(prev => ({
                  ...prev,
                  topic: e.target.value
                }))} className={styles.select}>
                        {content.topics?.map((top: string, tIdx: number) => <option key={tIdx} value={top}>{top}</option>)}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="wg-contact-message" className={styles.label}>{tr("m908")}</label>
                      <textarea id="wg-contact-message" rows={4} value={contactForm.message} onChange={e => setContactForm(prev => ({
                  ...prev,
                  message: e.target.value
                }))} placeholder={tr("m1389")} className={styles.textarea} />
                      {contactErrors.message && <div className={styles.formError}>{contactErrors.message}</div>}
                    </div>

                    <button type="submit" className={styles.btnPrimary}>{tr("m1398")}</button>
                    <p style={{
                marginTop: "12px",
                fontSize: "0.8rem",
                color: "#64748b",
                fontStyle: "italic"
              }}>{tr("m1399")}</p>
                  </form>}
              </div>

              {/* Info & Channels */}
              <div className={styles.contactInfo}>
                <div className={styles.channelsList}>
                  {content.channels?.map((chan: ChannelItem, idx: number) => <div key={idx} className={styles.channelItem}>
                      <div>
                        <h3 className={styles.channelLabel}>{chan.title}</h3>
                        <p className={styles.channelValue}>{chan.value}</p>
                        <p className={styles.channelSub}>{chan.note}</p>
                      </div>
                    </div>)}
                </div>

                <div className={styles.quickLinks}>
                  <h3 className={styles.quickTitle}>{tr("m912")}</h3>
                  <button type="button" onClick={() => navigateTo("faq")} className={styles.quickBtn}>{tr("m913")}</button>
                  <button type="button" onClick={() => navigateTo("refund-policy")} className={styles.quickBtn}>{tr("m914")}</button>
                  <button type="button" onClick={() => navigateTo("terms")} className={styles.quickBtn}>{tr("m915")}</button>
                </div>
              </div>
            </div>
          </div>}

        {/* Kind: CAREERS */}
        {content.kind === "careers" && <div className={styles.careersLayout}>
            {content.values && <div className={styles.valuesGrid}>
                {content.values.map((v: CareerValue, vIdx: number) => <div key={vIdx} className={styles.valueCard}>
                    <h3 className={styles.valueHeading}>{v.title}</h3>
                    <p className={styles.valueDesc}>{v.desc}</p>
                  </div>)}
              </div>}

            <h2 className={styles.careersHeading}>{tr("m917")}</h2>
            <div className={styles.rolesList}>
              {content.roles?.map((role: CareerRole) => <div key={role.id} className={styles.roleCard}>
                  <div className={styles.roleHeader}>
                    <div>
                      <h3 className={styles.roleTitle}>{role.title}</h3>
                      <div className={styles.roleMeta}>
                        <span className={styles.roleBadge}>{role.type}</span>
                        <span className={styles.roleBadge}>{role.location}</span>
                        {role.salary && <span className={styles.roleSalary}>{role.salary}</span>}
                      </div>
                    </div>
                    <div>
                      {appliedRoles[role.id] ? <button type="button" disabled className={styles.btnApplied}>{tr("m918")}</button> : <button type="button" onClick={() => handleApplyCareer(role)} className={styles.btnPrimary}>{tr("m919")}</button>}
                    </div>
                  </div>
                  <p className={styles.roleSummary}>{role.summary}</p>
                </div>)}
            </div>
            <p style={{
          marginTop: "16px",
          fontSize: "0.8rem",
          color: "#64748b",
          fontStyle: "italic",
          textAlign: "center"
        }}>{tr("m1399")}</p>
          </div>}

        {/* Kind: COMMUNITY */}
        {content.kind === "community" && <div className={styles.communityLayout}>
            <div className={styles.communityGrid}>
              {content.cards?.map((card: CommunityCard, cIdx: number) => <div key={cIdx} className={styles.communityCard}>
                  <h3 className={styles.communityCardTitle}>{card.title}</h3>
                  <p className={styles.communityCardDesc}>{card.desc}</p>
                  <button type="button" onClick={() => navigateTo(card.page)} className={styles.btnSecondary}>
                    {card.label} →
                  </button>
                </div>)}
            </div>
            <p style={{
          marginTop: "16px",
          fontSize: "0.8rem",
          color: "#64748b",
          fontStyle: "italic",
          textAlign: "center"
        }}>{tr("m1399")}</p>
          </div>}

        {/* Legal Disclaimer */}
        {content.disclaimer && <div className={styles.disclaimerBox}>
            <p className={styles.disclaimerText}>{content.disclaimer}</p>
          </div>}
      </main>

      {/* Bottom Auxiliary Navigation */}
      <footer className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <span className={styles.bottomNavText}>{tr("m923")}</span>
          <div className={styles.bottomNavActions}>
            <button type="button" onClick={() => navigateTo("home")} className={styles.btnSecondary}>{tr("m241")}</button>
            <button type="button" onClick={() => navigateTo("catalog")} className={styles.btnPrimary}>{tr("m609")}</button>
          </div>
        </div>
      </footer>
    </div>;
}