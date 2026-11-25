export function adminUserUpdate(user, draft, reason) {
  const changes = {};
  for (const field of ['firstName', 'lastName', 'email', 'phone']) {
    const value = draft[field]?.trim() ?? '';
    if (value !== (user[field] ?? '')) changes[field] = value;
  }
  return Object.keys(changes).length ? { ...changes, reason: reason.trim(), version: user.version } : null;
}

export function adminUserDraftValid(draft) {
  const email = draft.email.trim();
  const phone = draft.phone.trim();
  return Boolean(draft.firstName.trim() && draft.lastName.trim()
    && email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && (!phone || /^0\d{9}$/.test(phone)));
}
