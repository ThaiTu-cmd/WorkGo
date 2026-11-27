"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, FileCheck2, Hourglass, Users, type LucideIcon } from "lucide-react";
import { adminApi, useAuthToken } from "@/components/shell/backend";
import { canAccessAdminPath } from "@/components/admin/adminPolicy";
import { adminHref } from "@/components/admin/adminNav";
import { Notice, PageHeader, errorMessage } from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

type Stat = { key: string; label: string; hint: string; icon: LucideIcon; path: string; status?: string; load: () => Promise<{ result?: { totalElements?: number } }> };

const STATS: Stat[] = [
  {
    key: "pendingProviders",
    label: "Provider chờ duyệt",
    hint: "Hồ sơ đăng ký mới",
    icon: Hourglass,
    path: "providers",
    status: "PENDING",
    load: () => adminApi.listProviders({ status: "PENDING", size: 1 }),
  },
  {
    key: "verifiedProviders",
    label: "Provider đã duyệt",
    hint: "Đang có quyền PROVIDER",
    icon: BadgeCheck,
    path: "providers",
    status: "VERIFIED",
    load: () => adminApi.listProviders({ status: "VERIFIED", size: 1 }),
  },
  {
    key: "pendingDocs",
    label: "Giấy tờ chờ duyệt",
    hint: "Hồ sơ xác minh",
    icon: FileCheck2,
    path: "verifications",
    load: () => adminApi.listVerifications({ status: "PENDING", size: 1 }),
  },
  {
    key: "users",
    label: "Người dùng",
    hint: "Tổng số tài khoản",
    icon: Users,
    path: "users",
    load: () => adminApi.listUsers({ size: 1 }),
  },
];

export default function AdminDashboardPage() {
  const token = useAuthToken();
  const stats = useMemo(() => STATS.filter(item => canAccessAdminPath(token, item.path)), [token]);
  const { locale = "vi" } = useParams<{ locale: string }>() ?? {};
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled(stats.map((s) => s.load())).then((results) => {
      if (!alive) return;
      const next: Record<string, number | null> = {};
      results.forEach((r, i) => {
        next[stats[i].key] = r.status === "fulfilled" ? (r.value?.result?.totalElements ?? 0) : null;
      });
      setValues(next);
      const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
      setError(failed ? errorMessage(failed.reason) : null);
    });
    return () => {
      alive = false;
    };
  }, [stats]);

  return (
    <>
      <PageHeader title="Tổng quan" sub="Tình hình hệ thống WorkGo." />
      {error && <Notice tone="error">Một số số liệu không tải được: {error}</Notice>}
      <div className={styles.stats}>
        {stats.map((s) => {
          const v = values[s.key];
          return (
            <Link key={s.key} href={`${adminHref(locale, s.path)}${s.status ? `?status=${s.status}` : ""}`} className={`${styles.card} ${styles.stat}`}>
              <span className={styles.statLabel}>
                <s.icon size={16} aria-hidden="true" /> {s.label}
              </span>
              <span className={styles.statValue}>{v === undefined ? "…" : v === null ? "—" : v}</span>
              <span className={styles.statHint}>{s.hint}</span>
            </Link>
          );
        })}
      </div>
      <div className={`${styles.card} ${styles.cardPad}`}>
        <h2 className={styles.dialogTitle}>Quy trình duyệt Provider</h2>
        <ol className={styles.dialogBody} style={{ paddingLeft: 18, listStyle: "decimal" }}>
          <li>Người dùng gửi hồ sơ ở mục &quot;Làm Provider&quot; → hồ sơ ở trạng thái Chờ duyệt.</li>
          <li>Admin kiểm tra giấy tờ xác minh (nếu có) và duyệt hồ sơ ở mục Quản lý Provider.</li>
          <li>Khi hồ sơ được duyệt, tài khoản được cấp quyền PROVIDER; người dùng cần đăng nhập lại.</li>
        </ol>
      </div>
    </>
  );
}
