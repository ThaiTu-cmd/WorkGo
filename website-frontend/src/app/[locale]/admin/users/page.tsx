"use client";

import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { adminApi, decodeToken, joinFullName, useAuthToken } from "@/components/shell/backend";
import { ConfirmDialog, ListState, Notice, PageHeader, Pagination, StatusBadge, cx, errorMessage, formatDate, useAdminList } from "@/components/admin/ui";
import { adminUserDraftValid, adminUserUpdate } from "@/components/admin/adminUserUpdate";
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
  { action: "lock" | "edit" } | { action: "grant" | "revoke"; role: (typeof MANAGED_ROLES)[number] }
);
type UserDraft = { firstName: string; lastName: string; email: string; phone: string };

export default function AdminUsersPage() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const list = useAdminList<User>((page) => adminApi.listUsers({ page, size: 15 }), "users");
  const token = useAuthToken();
  const currentUserId = decodeToken(token)?.userId;
  const [selection, setSelection] = useState<AccountAction | null>(null);
  const [reason, setReason] = useState("");
  const [draft, setDraft] = useState<UserDraft>({ firstName: "", lastName: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const choose = (selection: AccountAction) => {
    setReason("");
    setDraft({ firstName: selection.user.firstName ?? "", lastName: selection.user.lastName ?? "", email: selection.user.email ?? "", phone: selection.user.phone ?? "" });
    setNotice(null);
    setSelection(selection);
  };

  const confirm = async () => {
    if (!selection || !reason.trim() || busy) return;
    const { user, action } = selection;
    if (user.version == null) return;
    const update = action === "edit" ? adminUserUpdate(user, draft, reason) : null;
    if (action === "edit" && (!update || !adminUserDraftValid(draft))) return;
    setBusy(true);
    const body = { reason: reason.trim(), version: user.version };
    try {
      if (action === "lock") await adminApi.deleteUser(user.userId, body);
      else if (action === "edit") await adminApi.updateUser(user.userId, update);
      else if (selection.action === "grant") await adminApi.grantUserRole(user.userId, { ...body, roleName: selection.role });
      else if (selection.action === "revoke") await adminApi.revokeUserRole(user.userId, { ...body, roleName: selection.role });
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
                                <button type="button" className={styles.btn} onClick={() => choose({ user: u, action: "edit" })}>{t("editUser")}</button>
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
          title={selection.action === "lock" ? t("lock") : selection.action === "edit" ? t("editUser") : selection.action === "grant" || selection.action === "revoke" ? t(selection.action, { p0: selection.role }) : ""}
          body={<>
            <p>{joinFullName(selection.user)} (@{selection.user.userName})</p>
            {selection.action === "edit" && <>
              {(["firstName", "lastName", "email", "phone"] as const).map(field => <label key={field} className={styles.field}>
                {t(field)}
                <input type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} required={field !== "phone"} value={draft[field]} disabled={busy} onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))} />
              </label>)}
              {!adminUserUpdate(selection.user, draft, reason) && <p>{t("noChanges")}</p>}
              {!adminUserDraftValid(draft) && <p>{t("invalidProfile")}</p>}
            </>}
            <label className={styles.field}>
              {t("reason")}
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
            </label>
            {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
          </>}
          confirmLabel={t("confirm")}
          danger={selection.action === "lock" || selection.action === "revoke"}
          busy={busy}
          disabled={!reason.trim() || (selection.action === "edit" && (!adminUserUpdate(selection.user, draft, reason) || !adminUserDraftValid(draft)))}
          onConfirm={confirm}
          onCancel={() => setSelection(null)}
        />
      )}
    </>
  );
}
