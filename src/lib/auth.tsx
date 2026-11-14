import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiHasPin, apiResetPin, apiSetPin, apiVerifyPin } from "./pinApi";

const PIN_KEY = "kas-alhusna:pin-hash";
const SESSION_KEY = "kas-alhusna:bendahara";

interface AuthValue {
  isBendahara: boolean;
  hasPin: boolean;
  authLoading: boolean;
  backendAvailable: boolean;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (pin: string) => Promise<boolean>;
  savePin: (pin: string) => Promise<void>;
  resetPin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function read(key: string, storage: Storage): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null, storage: Storage): void {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // Mode privat bisa menolak penyimpanan; anggap sesi tidak tersimpan.
  }
}

async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`kas-alhusna:${pin}`);
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Jatuh ke hash sederhana bila Web Crypto tidak tersedia (mis. konteks non-HTTPS).
    }
  }
  let hash = 0;
  for (const byte of bytes) hash = (hash * 31 + byte) >>> 0;
  return `weak:${hash.toString(16)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [isBendahara, setIsBendahara] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const apiResult = await apiHasPin();
      if (cancelled) return;
      if (apiResult !== null) {
        setHasPin(apiResult);
        setBackendAvailable(true);
      } else {
        setHasPin(Boolean(read(PIN_KEY, localStorage)));
        setBackendAvailable(false);
      }
      setIsBendahara(
        Boolean(read(PIN_KEY, localStorage)) && read(SESSION_KEY, sessionStorage) === "1",
      );
      // Jika backend tersedia, sesi lokal tetap berlaku; bendahara ditentukan oleh flag sesi.
      setIsBendahara(read(SESSION_KEY, sessionStorage) === "1");
      setAuthLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openLogin = useCallback(() => setIsLoginOpen(true), []);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

  const setSession = useCallback((active: boolean) => {
    setIsBendahara(active);
    write(SESSION_KEY, active ? "1" : null, sessionStorage);
  }, []);

  const login = useCallback(
    async (pin: string) => {
      if (backendAvailable) {
        const ok = await apiVerifyPin(pin);
        if (ok === null) {
          // Fallback ke lokal bila API gagal.
          const stored = read(PIN_KEY, localStorage);
          const matches = stored === (await hashPin(pin));
          if (matches) setSession(true);
          return matches;
        }
        if (ok) setSession(true);
        return ok;
      }
      const stored = read(PIN_KEY, localStorage);
      if (!stored) return false;
      const matches = stored === (await hashPin(pin));
      if (matches) setSession(true);
      return matches;
    },
    [backendAvailable, setSession],
  );

  const savePin = useCallback(
    async (pin: string) => {
      if (backendAvailable) {
        const ok = await apiSetPin(pin);
        if (ok === null) {
          // Fallback ke lokal.
          write(PIN_KEY, await hashPin(pin), localStorage);
        }
      } else {
        write(PIN_KEY, await hashPin(pin), localStorage);
      }
      setHasPin(true);
      setSession(true);
    },
    [backendAvailable, setSession],
  );

  const resetPin = useCallback(async () => {
    if (backendAvailable) {
      const ok = await apiResetPin();
      if (ok === null) {
        write(PIN_KEY, null, localStorage);
      }
    } else {
      write(PIN_KEY, null, localStorage);
    }
    setHasPin(false);
    setSession(false);
  }, [backendAvailable, setSession]);

  const logout = useCallback(() => setSession(false), [setSession]);

  const value = useMemo<AuthValue>(
    () => ({
      isBendahara,
      hasPin: hasPin ?? false,
      authLoading,
      backendAvailable,
      isLoginOpen,
      openLogin,
      closeLogin,
      login,
      savePin,
      resetPin,
      logout,
    }),
    [
      isBendahara,
      hasPin,
      authLoading,
      backendAvailable,
      isLoginOpen,
      openLogin,
      closeLogin,
      login,
      savePin,
      resetPin,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return auth;
}
