"use client";

import { RefreshCw } from "lucide-react";
import { adminApi, joinFullName } from "@/components/webapp-bridge/backend";
import { ListState, PageHeader, Pagination, StatusBadge, cx, formatDate, useAdminList } from "@/components/admin/ui";
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
};

const ROLE_TONE: Record<string, string> = {
  ADMIN: styles.badgeDanger,
  PROVIDER: styles.badgeSuccess,
  CLIENT: styles.badgeInfo,
};

export default function AdminUsersPage() {
  const list = useAdminList<User>((page) => adminApi.listUsers({ page, size: 15 }), "users");

  return (
    <>
      <PageHeader title="Người dùng" sub="Danh sách tài khoản, vai trò và trạng thái.">
        <button type="button" className={styles.btn} onClick={list.reload}>
          <RefreshCw size={14} /> Tải lại
        </button>
      </PageHeader>

      <div className={styles.card}>
        <ListState loading={list.loading} error={list.error} empty={!list.items.length} onRetry={list.reload} />
        {!list.loading && !list.error && list.items.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Tạo lúc</th>
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
                        <td>{formatDate(u.createdAt)}</td>
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
    </>
  );
}
