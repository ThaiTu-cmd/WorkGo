"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { adminApi } from "@/components/webapp-bridge/backend";
import {
  AdminTable,
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
  downloadAdminFile,
  errorMessage,
  formatDate,
  shortId,
  useAdminList,
  useAdminArray,
} from "@/components/admin/ui";
import styles from "@/components/admin/admin.module.css";

type Verification = {
  providerVerificationId: string;
  verificationType?: string;
  documentType?: string;
  verificationStatus: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  providerProfileId?: string;
};

type VerificationDocument = {
  verificationDocumentId: string;
  originalName: string;
  mimeType: string;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  IDENTITY_CARD: "CCCD / CMND",
  BUSINESS_LICENSE: "Giấy phép kinh doanh",
  TAX_CODE: "Mã số thuế",
  PROFESSIONAL_CERT: "Chứng chỉ nghề",
};

const ACTION: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Duyệt", className: styles.btnSuccess },
  REJECTED: { label: "Từ chối", className: styles.btnDanger },
  SUSPENDED: { label: "Tạm khoá", className: styles.btnDanger },
};

export default function AdminVerificationsPage() {
  const t = useTranslations("adminOperations");
  const [status, setStatus] = useState("PENDING");
  const list = useAdminList<Verification>((page) => adminApi.listVerifications({ status, page, size: 10 }), status);
  const [pending, setPending] = useState<{ item: Verification; next: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminApi.reviewVerification(pending.item.providerVerificationId, pending.next);
      setNotice({ tone: "success", text: `Giấy tờ đã chuyển sang trạng thái ${STATUS_LABEL[pending.next]}.` });
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
      <PageHeader title="Giấy tờ xác minh" sub="Kiểm tra giấy tờ provider đã nộp.">
        <button type="button" className={styles.btn} onClick={list.reload}>
          <RefreshCw size={14} /> Tải lại
        </button>
      </PageHeader>

      <Notice>
        Duyệt giấy tờ không tự động duyệt hồ sơ provider. Sau khi kiểm tra giấy tờ, hãy duyệt hồ sơ ở mục Quản lý
        Provider để cấp quyền.
      </Notice>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <StatusTabs value={status} options={VERIFICATION_STATUSES} onChange={(next) => { setStatus(next); setVerificationId(null); }} />

      <div className={styles.card}>
        <ListState loading={list.loading} error={list.error} empty={!list.items.length} onRetry={list.reload} />
        {!list.loading && !list.error && list.items.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Loại giấy tờ</th>
                    <th>Provider</th>
                    <th>Nộp lúc</th>
                    <th>Xét duyệt</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((v) => (
                    <tr key={v.providerVerificationId}>
                      <td>
                        <div className={styles.cellMain}>
                          {TYPE_LABEL[v.verificationType ?? ""] ?? v.verificationType ?? "—"}
                        </div>
                        {v.documentType && <div className={styles.cellSub}>{v.documentType}</div>}
                      </td>
                      <td>
                        <span className={styles.mono} title={v.providerProfileId}>
                          {shortId(v.providerProfileId)}
                        </span>
                      </td>
                      <td>{formatDate(v.submittedAt)}</td>
                      <td>
                        {formatDate(v.verifiedAt)}
                        {v.verifiedBy && (
                          <div className={styles.cellSub} title={v.verifiedBy}>
                            bởi {shortId(v.verifiedBy)}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={v.verificationStatus} />
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button type="button" className={styles.btn} onClick={() => setVerificationId(v.providerVerificationId)} aria-pressed={verificationId === v.providerVerificationId}>
                            {t("verificationDocuments")}
                          </button>
                          {(VERIFICATION_TRANSITIONS[v.verificationStatus] ?? []).map((next) => (
                            <button
                              key={next}
                              type="button"
                              className={cx(styles.btn, ACTION[next].className)}
                              onClick={() => setPending({ item: v, next })}
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

      {verificationId && <VerificationDocuments key={verificationId} verificationId={verificationId} onClose={() => setVerificationId(null)} />}

      {pending && (
        <ConfirmDialog
          title={`${ACTION[pending.next].label} giấy tờ này?`}
          body={`${TYPE_LABEL[pending.item.verificationType ?? ""] ?? "Giấy tờ"} của provider ${shortId(
            pending.item.providerProfileId,
          )} sẽ chuyển sang "${ACTION[pending.next].label}".`}
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

function VerificationDocuments({ verificationId, onClose }: { verificationId: string; onClose: () => void }) {
  const t = useTranslations("adminOperations");
  const list = useAdminArray<VerificationDocument>(() => adminApi.listVerificationDocuments(verificationId), verificationId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download(file: VerificationDocument) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await adminApi.downloadVerificationDocument(verificationId, file.verificationDocumentId);
      if (!(blob instanceof Blob)) throw new Error(t("downloadFailed"));
      downloadAdminFile(blob, file.originalName);
    } catch (err) {
      setError(err instanceof Error && err.message === "INVALID_VERIFICATION_DOCUMENT_LINK" ? t("downloadFailed") : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cx(styles.card, styles.cardPad, styles.stack)} aria-label={t("verificationDocuments")}>
      <div className={styles.pageHeader}>
        <h2>{t("verificationDocuments")}</h2>
        <button type="button" className={styles.btn} onClick={onClose}>{t("close")}</button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <AdminTable list={list} paginate={false} headers={[t("document"), t("createdAt"), t("actions")]}>
        {list.items.map((file) => (
          <tr key={file.verificationDocumentId}>
            <td>{file.originalName}<div className={styles.cellSub}>{file.mimeType}</div></td>
            <td>{formatDate(file.createdAt)}</td>
            <td><button type="button" className={styles.btn} disabled={busy} onClick={() => void download(file)}>{t("download")}</button></td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}
