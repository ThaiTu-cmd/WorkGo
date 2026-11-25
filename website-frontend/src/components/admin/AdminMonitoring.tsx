"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { adminApi, useAuthToken } from "@/components/webapp-bridge/backend";
import { hasRole } from "@/_webapp-mirror/utils/jwt";
import { AdminTable, ListState, Notice, PageHeader, StatusBadge, cx, downloadAdminFile, errorMessage, formatDate, formatMoney, useAdminArray, useAdminList } from "./ui";
import styles from "./admin.module.css";

const ORDER_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "CANCELLED"];
const EXECUTION_TYPES = ["DIGITAL", "ONSITE"];

type Order = {
  orderId: string;
  orderNumber?: string;
  title?: string;
  clientId: string;
  providerId: string;
  orderStatus: string;
  paymentStatus?: string;
  paymentMethod?: string;
  executionType: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
};

type OrderDetail = {
  order: Order;
  snapshot?: {
    serviceSnapshot?: { title: string };
    packageSnapshot?: { name: string };
    pricingSnapshot?: { providerNetAmount: number; platformFee: number; feePolicyVersionNo?: number; currency?: string };
  };
  items: { orderItemId: string; name: string; quantity: number; amount: number }[];
};

type History = {
  orderStatusHistoryId: string;
  fromStatus?: string;
  toStatus: string;
  roleName: string;
  actorId?: string;
  createdAt: string;
};

type AuditLog = {
  adminActionLogId: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  reason?: string;
  beforeState?: string;
  afterState?: string;
  correlationId?: string;
  createdAt: string;
};

function readFilters(form: HTMLFormElement) {
  const values: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value !== "string" || !value.trim()) return;
    values[key] = key === "from" || key === "to" ? new Date(value).toISOString() : value.trim();
  });
  return values;
}
export function OrderMonitoring() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [orderId, setOrderId] = useState<string | null>(null);
  const list = useAdminList<Order>((page) => adminApi.listOrders({ ...filters, page }), JSON.stringify(filters));
  const filterOrders = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderId(null);
    setFilters(readFilters(event.currentTarget));
    list.setPage(0);
    list.reload();
  };

  return (
    <section className={styles.stack}>
      <PageHeader title={t("monitoring")} />
      <form className={styles.filters} onSubmit={filterOrders}>
        <label className={styles.field}>
          {t("status")}
          <select name="status">
            <option value="">{t("all")}</option>
            {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          {t("execution")}
          <select name="executionType">
            <option value="">{t("all")}</option>
            {EXECUTION_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className={styles.field}>{t("clientId")}<input name="clientId" /></label>
        <label className={styles.field}>{t("providerId")}<input name="providerId" /></label>
        <label className={styles.field}>{t("from")}<input name="from" type="datetime-local" /></label>
        <label className={styles.field}>{t("to")}<input name="to" type="datetime-local" /></label>
        <button className={styles.btn} type="submit">{t("filter")}</button>
      </form>
      <AdminTable list={list} headers={[t("order"), t("execution"), t("status"), t("amount"), t("createdAt"), t("actions")]}>
        {list.items.map((order) => (
          <tr key={order.orderId}>
            <td>
              <div className={styles.cellMain}>{order.orderNumber ?? order.orderId}</div>
              <div className={styles.cellSub}>{order.title}</div>
            </td>
            <td>{order.executionType}</td>
            <td><StatusBadge status={order.orderStatus} /></td>
            <td>{formatMoney(locale, order.totalAmount, order.currency)}</td>
            <td>{formatDate(order.createdAt, locale)}</td>
            <td><button className={styles.btn} type="button" aria-pressed={orderId === order.orderId} onClick={() => setOrderId(order.orderId)}>{t("view")}</button></td>
          </tr>
        ))}
      </AdminTable>
      {orderId && <MonitoredOrder key={orderId} orderId={orderId} onClose={() => setOrderId(null)} />}
    </section>
  );
}

function MonitoredOrder({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const details = useAdminArray<OrderDetail>(async () => {
    const { result } = await adminApi.getOrder(orderId);
    return { result: result ? [result] : [] };
  }, orderId);
  const history = useAdminList<History>((page) => adminApi.getOrderHistory(orderId, page), orderId);
  const detail = details.loading || details.error ? null : details.items[0];
  const pricing = detail?.snapshot?.pricingSnapshot;

  return (
    <section className={cx(styles.card, styles.cardPad, styles.stack)} aria-label={t("orderDetails")}>
      <div className={styles.pageHeader}>
        <h2>{t("orderDetails")}</h2>
        <button className={styles.btn} type="button" onClick={onClose}>{t("close")}</button>
      </div>
      <ListState loading={details.loading} error={details.error} empty={!detail} onRetry={details.reload} />
      {detail && (
        <>
          <dl>
            <dt>{t("order")}</dt><dd>{detail.order.orderNumber ?? orderId}</dd>
            <dt>{t("clientId")}</dt><dd>{detail.order.clientId}</dd>
            <dt>{t("providerId")}</dt><dd>{detail.order.providerId}</dd>
            <dt>{t("payment")}</dt><dd>{detail.order.paymentMethod ?? "—"} · {detail.order.paymentStatus ?? "—"}</dd>
          </dl>
          <h3>{t("snapshot")}</h3>
          <p>{detail.snapshot?.serviceSnapshot?.title ?? detail.order.title ?? "—"} · {detail.snapshot?.packageSnapshot?.name ?? "—"}</p>
          {pricing && <p>{t("platformFee")}: {formatMoney(locale, pricing.platformFee, pricing.currency)} · {t("providerNet")}: {formatMoney(locale, pricing.providerNetAmount, pricing.currency)} · {t("version")}: {pricing.feePolicyVersionNo ?? "—"}</p>}
          {detail.items?.length > 0 && <ul>{detail.items.map((item) => <li key={item.orderItemId}>{item.name} × {item.quantity} · {formatMoney(locale, item.amount, detail.order.currency)}</li>)}</ul>}
          <h3>{t("history")}</h3>
          <AdminTable list={history} headers={[t("transition"), t("actor"), t("createdAt")]}>
            {history.items.map((event) => (
              <tr key={event.orderStatusHistoryId}>
                <td>{event.fromStatus ?? "—"} → {event.toStatus}</td>
                <td>{event.roleName}<div className={styles.cellSub}>{event.actorId}</div></td>
                <td>{formatDate(event.createdAt, locale)}</td>
              </tr>
            ))}
          </AdminTable>
        </>
      )}
    </section>
  );
}

export function AdminAudit() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const token = useAuthToken();
  const isSuperAdmin = hasRole(token, "SUPER_ADMIN");
  const [source, setSource] = useState<"identity" | "catalog" | "payment" | "communication" | "job" | "trust">("identity");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const list = useAdminList<AuditLog>((page) => adminApi.listAuditLogs(source, { ...filters, page }), source + JSON.stringify(filters));
  const filterLogs = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(readFilters(event.currentTarget));
    list.setPage(0);
    list.reload();
  };
  const exportLogs = async (form: HTMLFormElement) => {
    if (!isSuperAdmin || exporting) return;
    const params = readFilters(form);
    if (!params.from || !params.to || params.from >= params.to) {
      setExportError(t("exportDateRange"));
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const blob = await adminApi.exportAuditLogs(source, params);
      if (!(blob instanceof Blob)) throw new Error(t("downloadFailed"));
      downloadAdminFile(blob, source + "-audit-logs.csv");
      list.reload();
    } catch (err) {
      setExportError(errorMessage(err, t));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className={styles.stack}>
      <PageHeader title={t("audit")} sub={isSuperAdmin ? undefined : t("ownAudit")} />
      <form className={styles.filters} onSubmit={filterLogs}>
        <label className={styles.field}>
          {t("source")}
          <select value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
            <option value="identity">Identity</option>
            <option value="catalog">Catalog</option>
            <option value="payment">Payment</option>
            <option value="communication">Communication</option>
            <option value="job">Job</option>
            <option value="trust">Trust</option>
          </select>
        </label>
        {isSuperAdmin && <label className={styles.field}>{t("actorId")}<input name="actorId" /></label>}
        <label className={styles.field}>{t("auditAction")}<input name="action" /></label>
        <label className={styles.field}>{t("targetType")}<input name="targetType" /></label>
        <label className={styles.field}>{t("targetId")}<input name="targetId" /></label>
        <label className={styles.field}>{t("from")}<input name="from" type="datetime-local" /></label>
        <label className={styles.field}>{t("to")}<input name="to" type="datetime-local" /></label>
        <button className={styles.btn} type="submit">{t("filter")}</button>
        {isSuperAdmin && <button className={styles.btn} type="button" disabled={exporting} onClick={(e) => { if (e.currentTarget.form) void exportLogs(e.currentTarget.form); }}>{t("exportCsv")}</button>}
      </form>
      {exportError && <Notice tone="error">{exportError}</Notice>}
      <AdminTable list={list} headers={[t("createdAt"), t("actor"), t("auditAction"), t("target"), t("reason"), t("actions")]}>
        {list.items.map((log) => (
          <tr key={log.adminActionLogId}>
            <td>{formatDate(log.createdAt, locale)}</td>
            <td>{log.actorRole}<div className={styles.cellSub}>{log.actorId}</div></td>
            <td>{log.action}</td>
            <td>{log.targetType}<div className={styles.cellSub}>{log.targetId}</div></td>
            <td>{log.reason || "—"}</td>
            <td>
              <details>
                <summary>{t("view")}</summary>
                <p>{t("beforeState")}</p><pre className={styles.stateDetails}>{log.beforeState || "—"}</pre>
                <p>{t("afterState")}</p><pre className={styles.stateDetails}>{log.afterState || "—"}</pre>
                <p>{t("correlationId")}: {log.correlationId || "—"}</p>
              </details>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}
