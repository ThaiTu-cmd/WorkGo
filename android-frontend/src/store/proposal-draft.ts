import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MobileProposalDraft {
  price?: string | number;
  estimatedDays?: string | number;
  message?: string;
}

export function getProposalDraftKey(userId: string | null | undefined, postId: string): string {
  const uid = userId && userId.trim() ? userId.trim() : 'guest';
  return `draft_proposal_v1:${uid}:${postId}`;
}

export async function loadDraft(
  userId: string | null | undefined,
  postId: string
): Promise<MobileProposalDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(getProposalDraftKey(userId, postId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      price: parsed.price !== undefined ? parsed.price : undefined,
      estimatedDays: parsed.estimatedDays !== undefined ? parsed.estimatedDays : undefined,
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
    };
  } catch {
    // Corrupt JSON or storage error
    return null;
  }
}

export async function saveDraft(
  userId: string | null | undefined,
  postId: string,
  draft: MobileProposalDraft
): Promise<void> {
  try {
    await AsyncStorage.setItem(getProposalDraftKey(userId, postId), JSON.stringify(draft));
  } catch {
    // Silently handle quota errors
  }
}

export async function clearDraft(
  userId: string | null | undefined,
  postId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(getProposalDraftKey(userId, postId));
  } catch {
    // Silently ignore removal errors
  }
}
