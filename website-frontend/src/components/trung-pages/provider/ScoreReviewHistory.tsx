"use client";

import { useEffect, useState } from "react";
import { adminApi, useAuthToken } from "../../webapp-bridge/backend";

export type ScoreReviewReceipt = {
  reviewId: string;
  providerId: string;
  score: number;
  sourceVersion: number;
  outcome: "KEEP_RESTRICTED" | "BAN_PROVIDER";
  reason: string;
  reference: string;
  reviewedAt: string;
  sanctionId?: string | null;
};

export function scoreReviewLabel(outcome: ScoreReviewReceipt["outcome"]) {
  return outcome === "BAN_PROVIDER" ? "Cấm hoạt động Provider" : "Tiếp tục hạn chế nhận việc";
}

export default function ScoreReviewHistory({ providerId, revision = 0 }: { providerId: string; revision?: number }) {
  const token = useAuthToken();
  return <History key={`${token}:${providerId}:${revision}`} providerId={providerId} />;
}

function History({ providerId }: { providerId: string }) {
  const [rows, setRows] = useState<ScoreReviewReceipt[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    adminApi.providerScoreReviews(providerId).then(response => {
      if (active) setRows(response.result);
    }).catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : "Không tải được lịch sử xét điểm.");
    });
    return () => { active = false; };
  }, [providerId, attempt]);
  return <section aria-label="Lịch sử xét điểm thấp">
    <h2>Lịch sử xét điểm 0–4</h2>
    <p>Kết luận không tự tăng điểm hoặc mở lại quyền nhận việc. Chế tài Provider có thể được kháng nghị tại mục chế tài.</p>
    {error ? <p role="alert">{error} <button onClick={() => { setError(""); setAttempt(n => n + 1); }}>Thử lại</button></p>
      : rows === null ? <p role="status">Đang tải lịch sử…</p>
      : rows.length === 0 ? <p>Chưa có kết luận xét điểm.</p>
      : <ul>{rows.map(row => <li key={row.reviewId}>
        <strong>{scoreReviewLabel(row.outcome)}</strong>
        <p>Điểm {row.score} · Phiên bản {row.sourceVersion} · {new Date(row.reviewedAt).toLocaleString("vi-VN")}</p>
        <p>{row.reason}</p><p>Hồ sơ tham chiếu: {row.reference}</p>
        {row.sanctionId && <p>Chế tài: {row.sanctionId}</p>}
      </li>)}</ul>}
  </section>;
}
