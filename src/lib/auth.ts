// Local auth store. Master credentials are kept in localStorage so the
// master user can rotate them. Defaults: master / layka1711%
export type Role = "master" | "admin";

const MASTER_KEY = "caes.master.credentials";
const SESSION_KEY = "caes.session";

export type MasterCreds = { login: string; password: string };
export type Session = { role: Role; login: string };

const DEFAULT_MASTER: MasterCreds = { login: "master", password: "layka1711%" };

function isBrowser() {
  return typeof window !== "undefined";
}

export function getMaster(): MasterCreds {
  if (!isBrowser()) return DEFAULT_MASTER;
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (!raw) return DEFAULT_MASTER;
    return JSON.parse(raw) as MasterCreds;
  } catch {
    return DEFAULT_MASTER;
  }
}

export function setMaster(creds: MasterCreds) {
  if (!isBrowser()) return;
  localStorage.setItem(MASTER_KEY, JSON.stringify(creds));
}

export function getSession(): Session | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  if (!isBrowser()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function login(loginOrEmail: string, password: string): Session {
  const master = getMaster();
  if (loginOrEmail.trim() === master.login && password === master.password) {
    const s: Session = { role: "master", login: master.login };
    setSession(s);
    return s;
  }
  // Any other credential = admin (no signup yet, as requested).
  const s: Session = { role: "admin", login: loginOrEmail.trim() || "admin" };
  setSession(s);
  return s;
}
