"use client";

// Prototype Mode
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { mockJobs, type Job } from "../_mocks/mockJobs";
import { mockProposals, type Proposal } from "../_mocks/mockProposals";
import { KEYS } from "../_stores/keys";
import { mockWallet, type WalletState } from "../_mocks/mockWallet";
import styles from "./ProposalReviewPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  jobId?: string;
};
function loadJobs(): Job[] {
  if (typeof window === "undefined") return mockJobs;
  try {
    const raw = window.localStorage.getItem(KEYS.jobs);
    if (!raw) return mockJobs;
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p as Job[] : mockJobs;
  } catch {
    return mockJobs;
  }
}
function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return mockProposals;
  try {
    const raw = window.localStorage.getItem(KEYS.proposals);
    if (!raw) return mockProposals;
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p as Proposal[] : mockProposals;
  } catch {
    return mockProposals;
  }
}
function loadWallet(): WalletState {
  if (typeof window === "undefined") return mockWallet;
  try {
    const raw = window.localStorage.getItem(KEYS.wallet);
    if (!raw) return mockWallet;
    const p = JSON.parse(raw) as Partial<WalletState>;
    if (typeof p.held !== "number" || typeof p.released !== "number" || !Array.isArray(p.history)) return mockWallet;
    return p as WalletState;
  } catch {
    return mockWallet;
  }
}
export default function ProposalReviewPage({
  onNavigate,
  onShowToast,
  jobId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  // Lazy init is SSR-safe and remounts fresh on every shell navigation
  // (shell renders pages conditionally), so no post-mount sync is needed.
  const [jobs] = useState<Job[]>(() => loadJobs());
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [proposals, setProposals] = useState<Proposal[]>(() => loadProposals());
  const persist = (next: Proposal[]) => {
    setProposals(next);
    try {
      window.localStorage.setItem(KEYS.proposals, JSON.stringify(next));
    } catch {
      onShowToast(tr("m1175"));
    }
  };
  const list = useMemo(() => {
    const rows = selectedJobId ? proposals.filter(p => p.jobId === selectedJobId) : proposals;
    return [...rows].sort((a, b) => a.bidPrice - b.bidPrice);
  }, [proposals, selectedJobId]);
  const hasAccepted = useMemo(() => selectedJobId ? proposals.some(p => p.jobId === selectedJobId && p.status === "ACCEPTED") : false, [proposals, selectedJobId]);
  const accept = (id: string) => {
    const target = proposals.find(p => p.proposalId === id);
    if (!target) return;
    const next = proposals.map(p => {
      if (p.jobId !== target.jobId) return p;
      if (p.proposalId === id) return {
        ...p,
        status: "ACCEPTED" as const
      };
      return p.status === "PENDING" ? {
        ...p,
        status: "REJECTED" as const
      } : p;
    });
    persist(next);
    try {
      const w = loadWallet();
      window.localStorage.setItem(KEYS.wallet, JSON.stringify({
        held: w.held + target.bidPrice,
        released: w.released,
        history: [{
          id: `w-${target.proposalId}-${w.history.length}`,
          type: "HOLD",
          amount: target.bidPrice,
          label: tr("m1188", {
            p0: target.jobId
          }),
          at: new Date().toISOString().slice(0, 10)
        }, ...w.history]
      } satisfies WalletState));
    } catch {
      onShowToast(tr("m1175"));
      return;
    }
    onShowToast(tr("m1189"));
  };
  const reject = (id: string) => {
    if (!window.confirm(tr("m1190"))) return;
    persist(proposals.map(p => p.proposalId === id ? {
      ...p,
      status: "REJECTED" as const
    } : p));
    onShowToast(tr("m1191"));
  };
  return <main className={styles.wrap}>
      <h1 className={styles.title}>
        <ClipboardCheck size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m58")}</h1>
      <div style={{
      padding: "10px 14px",
      backgroundColor: "#fef3c7",
      border: "1px solid #fde68a",
      borderRadius: "8px",
      color: "#92400e",
      fontSize: "0.85rem",
      marginBottom: "16px",
      fontWeight: 500
    }}>{tr("m1196")}</div>
      <p className={styles.sub}>{tr("m1197")}</p>
      <label className={styles.field}>
        <span>{tr("m1198")}</span>
        <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
          <option value="">{tr("m1199")}</option>
          {jobs.map(j => <option key={j.jobId} value={j.jobId}>
              {j.title}
            </option>)}
        </select>
      </label>
      {selectedJobId === "" ? <p className={styles.hint}>{tr("m1200")}</p> : null}
      {list.length === 0 ? <p className={styles.empty}>{tr("m1559")}{" "}
          <button type="button" className={styles.link} onClick={() => onNavigate("job-list")}>{tr("m1202")}</button>
        </p> : <ul className={styles.list}>
          {list.map(p => <li key={p.proposalId} className={styles.item}>
              <p className={styles.provider}>{p.providerName}</p>
              <p className={styles.bid}>{p.bidPrice.toLocaleString("vi-VN")} ₫ • {p.durationDays}{tr("m1465")}</p>
              <p className={styles.msg}>{p.message}</p>
              <p className={styles.status} data-status={p.status}>
                {p.status === "PENDING" ? tr("m222") : p.status === "ACCEPTED" ? tr("m1192") : tr("m1193")}
              </p>
              {p.status === "PENDING" ? <div className={styles.actions}>
                  <button type="button" className={styles.primary} disabled={hasAccepted} onClick={() => accept(p.proposalId)} title={hasAccepted ? tr("m1194") : undefined}>{tr("m1205")}</button>
                  <button type="button" className={styles.ghost} onClick={() => reject(p.proposalId)}>{tr("m631")}</button>
                </div> : null}
            </li>)}
        </ul>}
    </main>;
}