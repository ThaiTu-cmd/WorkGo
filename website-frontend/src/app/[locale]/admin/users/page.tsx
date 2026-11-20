"use client";

import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { adminApi, decodeToken, joinFullName, useAuthToken } from "@/components/webapp-bridge/backend";
import { ConfirmDialog, ListState, Notice, PageHeader, Pagination, StatusBadge, cx, errorMessage, formatDate, useAdminList } from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

type User = {
  userId: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  roles?: { roleName: string }[];
  version?: number;
};

const ROLE_TONE: Record<string, string> = {
  ADMIN: styles.badgeDanger,
  SUPER_ADMIN: styles.badgeDanger,
  PROVIDER: styles.badgeSuccess,
  CLIENT: styles.badgeInfo,
};

const MANAGED_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
type AccountAction = { user: User } & (
  { action: "lock" } | { action: "grant" | "revoke"; role: (typeof MANAGED_ROLES)[number] }
);

export default function AdminUsersPage() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const list = useAdminList<User>((page) => adminApi.listUsers({ page, size: 15 }), "users");
  const token = useAuthToken();
  const currentUserId = decodeToken(token)?.userId;
  const [selection, setSelection] = useState<AccountAction | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const choose = (selection: AccountAction) => {
    setReason("");
    setNotice(null);
    setSelection(selection);
  };

  const confirm = async () => {
    if (!selection || !reason.trim() || busy) return;
    const { user, action } = selection;
    if (user.version == null) return;
    setBusy(true);
    const body = { reason: reason.trim(), version: user.version };
    try {
      if (action === "lock") await adminApi.deleteUser(user.userId, body);
      else if (action === "grant") await adminApi.grantUserRole(user.userId, { ...body, roleName: selection.role });
      else await adminApi.revokeUserRole(user.userId, { ...body, roleName: selection.role });
      setSelection(null);
      setNotice({ tone: "success", message: t("saved") });
      list.reload();
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? Number(err.code) : null;
      const message = code === 1034 ? t("signInAgain") : code === 1033 ? t("staleUser") : errorMessage(err, t);
      setNotice({ tone: "error", message });
      if (code === 1033) {
        setSelection(null);
        list.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t("users")} sub={t("usersSub")}>
        <button type="button" className={styles.btn} onClick={list.reload}>
          <RefreshCw size={14} /> {t("reload")}
        </button>
      </PageHeader>

      {notice && !selection && <Notice tone={notice.tone}>{notice.message}</Notice>}
      <div className={styles.card}>
        <ListState loading={list.loading} error={list.error} empty={!list.items.length} onRetry={list.reload} />
        {!list.loading && !list.error && list.items.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("users")}</th>
                    <th>{t("contact")}</th>
                    <th>{t("roles")}</th>
                    <th>{t("status")}</th>
                    <th>{t("createdAt")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((u) => {
                    // A role can appear twice (re-verified provider); show each once.
                    const roles = Array.from(new Set((u.roles ?? []).map((r) => r.roleName)));
                    return (
                      <tr key={u.userId}>
                        <td>
                          <div className={styles.cellMain}>{joinFullName(u)}</div>
                          <div className={styles.cellSub}>@{u.userName}</div>
                        </td>
                        <td>
                          <div>{u.email || "—"}</div>
                          {u.phone && <div className={styles.cellSub}>{u.phone}</div>}
                        </td>
                        <td>
                          <div className={styles.badgeRow}>
                            {roles.length
                              ? roles.map((r) => (
                                  <span key={r} className={cx(styles.badge, ROLE_TONE[r])}>
                                    {r}
                                  </span>
                                ))
                              : "—"}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={u.status} />
                        </td>
                        <td>{formatDate(u.createdAt, locale)}</td>
                        <td>
                          {currentUserId && u.userId !== currentUserId && u.version != null && (
                            <details>
                              <summary>{t("manageAccount")}</summary>
                              <div className={styles.badgeRow}>
                                {MANAGED_ROLES.map((role) => {
                                  const action = roles.includes(role) ? "revoke" : "grant";
                                  return <button key={role} type="button" className={styles.btn} onClick={() => choose({ user: u, role, action })}>{t(action, { p0: role })}</button>;
                                })}
                                {u.status === "ACTIVE" && <button type="button" className={styles.btn} onClick={() => choose({ user: u, action: "lock" })}>{t("lock")}</button>}
                              </div>
                            </details>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              totalElements={list.totalElements}
              onChange={list.setPage}
            />
          </>
        )}
      </div>
      {selection && (
        <ConfirmDialog
          title={selection.action === "lock" ? t("lock") : t(selection.action, { p0: selection.role })}
          body={<>
            <p>{joinFullName(selection.user)} (@{selection.user.userName})</p>
            <label className={styles.field}>
              {t("reason")}
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
            </label>
            {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
          </>}
          confirmLabel={t("confirm")}
          danger={selection.action !== "grant"}
          busy={busy}
          disabled={!reason.trim()}
          onConfirm={confirm}
          onCancel={() => setSelection(null)}
        />
      )}
    </>
  );
}
