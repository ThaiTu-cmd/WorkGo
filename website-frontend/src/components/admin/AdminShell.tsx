"use client";

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Home, Loader2, LogOut, Menu, ShieldCheck, ShieldX, X } from "lucide-react";
import { authApi, decodeToken, hasRole, useAuthToken } from "@/components/webapp-bridge/backend";
import { ADMIN_NAV, adminHref } from "./adminNav";
import { cx, errorMessage } from "./ui";
import styles from "./admin.module.css";

const noopSubscribe = () => () => {};

export default function AdminShell({ children }: { children: ReactNode }) {
  const token = useAuthToken() as string | null;
  // useAuthToken starts null until it reads localStorage after mount, so wait
  // for the client before deciding between login / forbidden / admin.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "vi";
  const pathname = usePathname();


  if (!ready) {
    return (
      <div className={styles.gate}>
        <Loader2 className={styles.spin} size={24} />
      </div>
    );
  }
  if (!token) return <AdminLogin locale={locale} />;
  if (!hasRole(token, "ADMIN")) return <Forbidden locale={locale} />;

  const userName = decodeToken(token)?.sub as string | undefined;
  const home = adminHref(locale, "");

  return (
    <div className={styles.root}>
      <aside className={cx(styles.sidebar, menuOpen && styles.sidebarOpen)} aria-label="Menu quản trị">
        <div className={styles.brand}>
          <span className={styles.brandMark}>W</span>
          <span>
            WorkGo
            <span className={styles.brandSub}>Admin</span>
          </span>
        </div>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((group) => (
            <div key={group.title}>
              <p className={styles.navGroupTitle}>{group.title}</p>
              {group.items.map((item) => {
                const href = adminHref(locale, item.path);
                const active = item.path
                  ? pathname === href || pathname.startsWith(`${href}/`)
                  : pathname === home;
                return (
                  <Link
                    key={item.path}
                    href={href}
                    className={cx(styles.navItem, active && styles.navItemActive)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon size={18} aria-hidden="true" />
                    {item.label}
                    {item.badge === "soon" && <span className={styles.navBadge}>Sắp có</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {userName && (
            <p className={styles.who}>
              Đăng nhập: <strong>{userName}</strong>
            </p>
          )}
          <Link href={`/${locale}`} className={styles.navItem}>
            <Home size={18} aria-hidden="true" /> Về trang chính
          </Link>
          <button type="button" className={cx(styles.navItem, styles.navButton)} onClick={() => authApi.logout()}>
            <LogOut size={18} aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      </aside>

      {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}

      <div className={styles.main}>
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          WorkGo Admin
        </div>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

function AdminLogin({ locale }: { locale: string }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.login(userName.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className={styles.gate}>
      <div className={cx(styles.card, styles.gateCard)}>
        <div className={styles.gateIcon}>
          <ShieldCheck size={24} />
        </div>
        <h1 className={styles.pageTitle}>Quản trị WorkGo</h1>
        <p className={styles.pageSub}>Đăng nhập bằng tài khoản có quyền ADMIN.</p>
        <form className={styles.form} onSubmit={submit} style={{ marginTop: 20 }}>
          <label className={styles.field}>
            Tên đăng nhập
            <input value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="username" required />
          </label>
          <label className={styles.field}>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className={styles.stateError}>{error}</p>}
          <button type="submit" className={cx(styles.btn, styles.btnPrimary)} disabled={busy}>
            {busy && <Loader2 size={14} className={styles.spin} />} Đăng nhập
          </button>
          <Link href={`/${locale}`} className={styles.btn}>
            Về trang chính
          </Link>
        </form>
      </div>
    </div>
  );
}

function Forbidden({ locale }: { locale: string }) {
  return (
    <div className={styles.gate}>
      <div className={cx(styles.card, styles.gateCard)}>
        <div className={styles.gateIcon} style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          <ShieldX size={24} />
        </div>
        <h1 className={styles.pageTitle}>Không có quyền truy cập</h1>
        <p className={styles.pageSub}>Tài khoản hiện tại không có quyền ADMIN.</p>
        <div className={styles.actions} style={{ marginTop: 20 }}>
          <Link href={`/${locale}`} className={styles.btn}>
            Về trang chính
          </Link>
          <button type="button" className={cx(styles.btn, styles.btnPrimary)} onClick={() => authApi.logout()}>
            Đăng nhập tài khoản khác
          </button>
        </div>
      </div>
    </div>
  );
}
