"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, FileCheck2, Hourglass, Users, type LucideIcon } from "lucide-react";
import { adminApi } from "@/components/webapp-bridge/backend";
import { adminHref } from "@/components/admin/adminNav";
import { Notice, PageHeader, errorMessage } from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

type Stat = { key: string; label: string; hint: string; icon: LucideIcon; path: string; load: () => Promise<{ result?: { totalElements?: number } }> };

const STATS: Stat[] = [
  {
    key: "pendingProviders",
    label: "Provider chờ duyệt",
    hint: "Hồ sơ đăng ký mới",
    icon: Hourglass,
    path: "providers",
    load: () => adminApi.listProviders({ status: "PENDING", size: 1 }),
  },
  {
    key: "verifiedProviders",
    label: "Provider đã duyệt",
    hint: "Đang có quyền PROVIDER",
    icon: BadgeCheck,
    path: "providers",
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
  const { locale = "vi" } = useParams<{ locale: string }>() ?? {};
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled(STATS.map((s) => s.load())).then((results) => {
      if (!alive) return;
      const next: Record<string, number | null> = {};
      results.forEach((r, i) => {
        next[STATS[i].key] = r.status === "fulfilled" ? (r.value?.result?.totalElements ?? 0) : null;
      });
      setValues(next);
      const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
      setError(failed ? errorMessage(failed.reason) : null);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageHeader title="Tổng quan" sub="Tình hình hệ thống WorkGo." />
      {error && <Notice tone="error">Một số số liệu không tải được: {error}</Notice>}
      <div className={styles.stats}>
        {STATS.map((s) => {
          const v = values[s.key];
          return (
            <Link key={s.key} href={adminHref(locale, s.path)} className={`${styles.card} ${styles.stat}`}>
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
