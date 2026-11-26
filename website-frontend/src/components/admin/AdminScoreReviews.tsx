"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, useAuthToken } from "@/components/webapp-bridge/backend";
import ScoreReviewHistory, { type ScoreReviewReceipt, scoreReviewLabel } from "../trung-pages/provider/ScoreReviewHistory";
import { Notice, PageHeader, errorMessage } from "./ui";

type Pending = { providerId: string; score: number; sourceVersion: number; lowScoreSince?: string };
type Command = { expectedReputationVersion: number; outcome: ScoreReviewReceipt["outcome"]; reason: string; reference: string };

export default function AdminScoreReviews() {
  const token = useAuthToken();
  return <Content key={token ?? "guest"} />;
}

function Content() {
  const [rows, setRows] = useState<Pending[]>([]);
  const [selected, setSelected] = useState<Pending | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [outcome, setOutcome] = useState<Command["outcome"]>("KEEP_RESTRICTED");
  const [retry, setRetry] = useState<Command | null>(null);
  const [receipt, setReceipt] = useState<ScoreReviewReceipt | null>(null);
  const flight = useRef(false);
  const mounted = useRef(true);

  async function load() {
    setLoading(true);
    try {
      const response = await adminApi.pendingScoreReviews();
      if (mounted.current) setRows(response.result);
    } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { if (mounted.current) setLoading(false); }
  }
  useEffect(() => {
    mounted.current = true;
    let active = true;
    adminApi.pendingScoreReviews().then(response => {
      if (active) setRows(response.result);
    }).catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, []);

  async function submit() {
    if (!selected || flight.current) return;
    const command = retry ?? { expectedReputationVersion: selected.sourceVersion, outcome, reason: reason.trim(), reference: reference.trim() };
    flight.current = true; setBusy(true); setError(""); setRetry(command);
    try {
      const response = await adminApi.reviewProviderScore(selected.providerId, command);
      if (!mounted.current) return;
      setReceipt(response.result); setRetry(null);
      await load();
    } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { flight.current = false; if (mounted.current) setBusy(false); }
  }

  return <section>
    <PageHeader title="Xét Provider điểm 0–4" />
    <p>SUPER_ADMIN độc lập xét hồ sơ. Giữ hạn chế không cấp điểm hoặc quyền nhận việc; cấm Provider không khóa vai trò CLIENT.</p>
    {error && <Notice tone="error">{error}</Notice>}
    <button disabled={busy || loading} onClick={() => { setError(""); void load(); }}>Tải lại hàng chờ</button>
    {loading ? <p role="status">Đang tải…</p> : rows.length === 0 ? <p>Không có Provider chờ xét.</p> : <ul>{rows.map(row =>
      <li key={row.providerId}><button disabled={busy || retry !== null} onClick={() => {
        setSelected(row); setReceipt(null); setReason(""); setReference(""); setOutcome("KEEP_RESTRICTED"); setError("");
      }}>{row.providerId} · Điểm {row.score} · Phiên bản {row.sourceVersion}</button></li>
    )}</ul>}
    {selected && <section>
      <h2>Hồ sơ {selected.providerId}</h2>
      <p>Điểm {selected.score} · Phiên bản {selected.sourceVersion} · Bắt đầu điểm thấp: {selected.lowScoreSince ? new Date(selected.lowScoreSince).toLocaleString("vi-VN") : "Chưa ghi nhận"}</p>
      {receipt ? <p role="status">Đã ghi kết luận: {scoreReviewLabel(receipt.outcome)} · Mã {receipt.reviewId}</p> : <form onSubmit={e => { e.preventDefault(); void submit(); }}>
        <fieldset disabled={busy || retry !== null}>
          <label>Kết luận <select value={outcome} onChange={e => setOutcome(e.target.value as Command["outcome"])}>
            <option value="KEEP_RESTRICTED">Tiếp tục hạn chế nhận việc</option><option value="BAN_PROVIDER">Cấm hoạt động Provider</option>
          </select></label>
          <label>Hồ sơ tham chiếu <input required maxLength={200} value={reference} onChange={e => setReference(e.target.value)} /></label>
          <label>Lý do <textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>
        </fieldset>
        {retry && <p>Chưa nhận được xác nhận. Thử lại giữ nguyên quyết định để lấy biên nhận; nếu phiên bản đã đổi, tải lại hàng chờ trước khi xét lại.</p>}
        <button disabled={busy || (!retry && (!reason.trim() || !reference.trim()))}>{busy ? "Đang ghi…" : retry ? "Thử lại cùng quyết định" : "Ghi kết luận"}</button>
        {retry && <button type="button" disabled={busy} onClick={() => { setRetry(null); setSelected(null); void load(); }}>Đóng hồ sơ và tải lại</button>}
      </form>}
      <ScoreReviewHistory providerId={selected.providerId} revision={receipt ? 1 : 0} />
    </section>}
  </section>;
}
