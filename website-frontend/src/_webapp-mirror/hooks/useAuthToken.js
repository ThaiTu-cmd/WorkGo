import { useEffect, useState } from 'react';
import { getAccessToken } from '../api/axiosClient';

// Current access token, kept in sync with login / logout / 401 clears
// (axiosClient fires `workgo-auth-changed`) and other tabs (`storage`).
export function useAuthToken() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const sync = () => setToken(getAccessToken());
    sync();
    window.addEventListener('workgo-auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('workgo-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return token;
}

export default useAuthToken;
