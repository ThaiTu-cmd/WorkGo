import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { decodeToken } from '../utils/jwt';
import { useAuthToken } from './useAuthToken';

// identity-service puts the username in the JWT subject; display-only fallback
// used while myInfo is unavailable.
export const tokenUserName = (token) => {
  const sub = decodeToken(token)?.sub;
  return typeof sub === 'string' && sub ? sub : null;
};

// Name of the signed-in user: "Nguyễn Văn A" from myInfo, the login id while
// that is unavailable, null when signed out.
export function useMyDisplayName() {
  const token = useAuthToken();
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    if (!token) {
      setDisplayName(null);
      return undefined;
    }
    let cancelled = false;
    authApi
      .getMyInfo()
      .then((res) => {
        if (cancelled) return;
        const user = res?.result;
        const full = [user?.lastName, user?.firstName].filter(Boolean).join(' ').trim();
        setDisplayName(full || user?.userName || tokenUserName(token) || null);
      })
      .catch(() => {
        if (!cancelled) setDisplayName(tokenUserName(token));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return displayName;
}

export default useMyDisplayName;
