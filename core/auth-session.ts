const AUTH_STORAGE_KEY = "shopadmin.auth.session";

type AuthUser = {
  role?: string;
  email?: string;
  name?: string;
  avatar?: string;
  color?: string;
};

type AuthSession = {
  user?: AuthUser;
  [key: string]: unknown;
};

function loadSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY) || window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession, persistent = false): void {
  if (typeof window === "undefined") {
    return;
  }

  const targetStorage = persistent ? window.localStorage : window.sessionStorage;
  const otherStorage = persistent ? window.sessionStorage : window.localStorage;

  otherStorage.removeItem(AUTH_STORAGE_KEY);
  targetStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function hasRole(session: AuthSession | null | undefined, role: string): boolean {
  if (!session || !session.user) {
    return false;
  }
  return session.user.role === role;
}

export { AUTH_STORAGE_KEY, loadSession, saveSession, clearSession, hasRole };
export type { AuthSession, AuthUser };

