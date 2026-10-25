const STORAGE_KEY = 'quizzy-multiplayer-token';

let memoryToken: string | null = null;

function generateToken(): string {
  return `token-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(
    36,
  )}`;
}

/**
 * `sessionStorage` where it exists and can be touched at all. On native there
 * is no window, and blocked or private-mode storage can throw on access, so
 * both cases give `null` and the caller falls back to the module variable.
 */
function sessionStore(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    return window.sessionStorage;
  } catch (e) {
    return null;
  }
}

/**
 * One token per tab (D12). On web it lives in `sessionStorage`, so a reload
 * keeps it, which is what a stable per-session token has to mean once a
 * refresh is recoverable. On native the module variable is used and no
 * storage API is touched; multiplayer is web-only (D10).
 */
export function getSessionToken(): string {
  if (memoryToken !== null) {
    return memoryToken;
  }

  const store = sessionStore();
  if (store) {
    try {
      const stored = store.getItem(STORAGE_KEY);
      if (stored) {
        memoryToken = stored;
        return stored;
      }
    } catch (e) {
      /* unreadable storage: fall through to a fresh token */
    }
  }

  const token = generateToken();
  memoryToken = token;

  if (store) {
    try {
      store.setItem(STORAGE_KEY, token);
    } catch (e) {
      /* unwritable storage: the module variable still holds the token */
    }
  }

  return token;
}
