export interface ProposalDraft {
  price?: number;
  estimatedDays?: number;
  message?: string;
  terms?: string;
}

export function getProposalDraftKey(userId: string | null | undefined, postId: string): string {
  const uid = userId && userId.trim() ? userId.trim() : "guest";
  return `draft_proposal_v1:${uid}:${postId}`;
}

export function loadDraft(userId: string | null | undefined, postId: string): ProposalDraft | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const raw = localStorage.getItem(getProposalDraftKey(userId, postId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      price: typeof parsed.price === "number" && !isNaN(parsed.price) ? parsed.price : undefined,
      estimatedDays: typeof parsed.estimatedDays === "number" && !isNaN(parsed.estimatedDays) ? parsed.estimatedDays : undefined,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      terms: typeof parsed.terms === "string" ? parsed.terms : undefined,
    };
  } catch {
    // Corrupt JSON or storage access error
    return null;
  }
}

export function saveDraft(
  userId: string | null | undefined,
  postId: string,
  draft: ProposalDraft
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(getProposalDraftKey(userId, postId), JSON.stringify(draft));
  } catch {
    // Silently handle quota errors or permission denied
  }
}

export function clearDraft(userId: string | null | undefined, postId: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    localStorage.removeItem(getProposalDraftKey(userId, postId));
  } catch {
    // Silently ignore removal errors
  }
}
