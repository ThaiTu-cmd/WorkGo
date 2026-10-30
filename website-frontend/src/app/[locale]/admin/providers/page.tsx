"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { adminApi } from "@/components/webapp-bridge/backend";
import {
  ConfirmDialog,
  ListState,
  Notice,
  PageHeader,
  Pagination,
  STATUS_LABEL,
  StatusBadge,
  StatusTabs,
  VERIFICATION_STATUSES,
  VERIFICATION_TRANSITIONS,
  cx,
  errorMessage,
  formatDate,
  shortId,
  useAdminList,
} from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

type Provider = {
  providerProfileId: string;
  providerType?: string;
  businessName?: string;
  bio?: string;
  verificationStatus: string;
  ratingAvg?: number;
  ratingCount?: number;
  completedOrderCount?: number;
  isAcceptingOrders?: boolean;
  joinedAt?: string;
  userId?: string;
};

const ACTION: Record<string, { label: string; className: string; confirm: string }> = {
  VERIFIED: {
    label: "Duyệt",
    className: styles.btnSuccess,
    confirm: "Hồ sơ sẽ chuyển sang Đã duyệt và tài khoản được cấp quyền PROVIDER. Người dùng cần đăng nhập lại để dùng quyền mới.",
  },
  REJECTED: {
    label: "Từ chối",
    className: styles.btnDanger,
    confirm: "Hồ sơ sẽ bị từ chối.",
  },
  SUSPENDED: {
    label: "Tạm khoá",
    className: styles.btnDanger,
    confirm: "Hồ sơ sẽ chuyển sang Tạm khoá.",
  },
};

const TYPE_LABEL: Record<string, string> = { INDIVIDUAL: "Cá nhân", COMPANY: "Doanh nghiệp" };

export default function AdminProvidersPage() {
  const [status, setStatus] = useState("PENDING");
  const list = useAdminList<Provider>((page) => adminApi.listProviders({ status, page, size: 10 }), status);
  const [pending, setPending] = useState<{ provider: Provider; next: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminApi.setProviderStatus(pending.provider.providerProfileId, pending.next);
      setNotice({
        tone: "success",
        text: `Đã chuyển "${pending.provider.businessName ?? "provider"}" sang trạng thái ${STATUS_LABEL[pending.next]}.`,
      });
      list.reload();
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <>
      <PageHeader title="Quản lý Provider" sub="Duyệt hồ sơ đăng ký và cấp quyền Provider.">
        <button type="button" className={styles.btn} onClick={list.reload}>
          <RefreshCw size={14} /> Tải lại
        </button>
      </PageHeader>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <StatusTabs value={status} options={VERIFICATION_STATUSES} onChange={setStatus} />

      <div className={styles.card}>
        <ListState loading={list.loading} error={list.error} empty={!list.items.length} onRetry={list.reload} />
        {!list.loading && !list.error && list.items.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Loại</th>
                    <th>Đánh giá</th>
                    <th>Tham gia</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((p) => (
                    <tr key={p.providerProfileId}>
                      <td>
                        <div className={styles.cellMain}>{p.businessName || "(chưa đặt tên)"}</div>
                        {p.bio && <div className={styles.cellSub}>{p.bio.length > 90 ? `${p.bio.slice(0, 90)}…` : p.bio}</div>}
                        <div className={styles.cellSub}>
                          Tài khoản:{" "}
                          <span className={styles.mono} title={p.userId}>
                            {shortId(p.userId)}
                          </span>
                        </div>
                      </td>
                      <td>{TYPE_LABEL[p.providerType ?? ""] ?? p.providerType ?? "—"}</td>
                      <td>
                        {p.ratingCount ? `${(p.ratingAvg ?? 0).toFixed(1)} ★ (${p.ratingCount})` : "—"}
                        <div className={styles.cellSub}>{p.completedOrderCount ?? 0} đơn hoàn thành</div>
                      </td>
                      <td>{formatDate(p.joinedAt)}</td>
                      <td>
                        <StatusBadge status={p.verificationStatus} />
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {(VERIFICATION_TRANSITIONS[p.verificationStatus] ?? []).map((next) => (
                            <button
                              key={next}
                              type="button"
                              className={cx(styles.btn, ACTION[next].className)}
                              onClick={() => setPending({ provider: p, next })}
                            >
                              {ACTION[next].label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {pending && (
        <ConfirmDialog
          title={`${ACTION[pending.next].label} "${pending.provider.businessName ?? "provider"}"?`}
          body={ACTION[pending.next].confirm}
          confirmLabel={ACTION[pending.next].label}
          danger={pending.next !== "VERIFIED"}
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
