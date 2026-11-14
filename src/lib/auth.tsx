import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const PIN_KEY = "kas-alhusna:pin-hash";
const SESSION_KEY = "kas-alhusna:bendahara";

interface AuthValue {
  isBendahara: boolean;
  hasPin: boolean;
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (pin: string) => Promise<boolean>;
  savePin: (pin: string) => Promise<void>;
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

/**
 * PIN disimpan sebagai hash SHA-256 agar tidak terbaca sebagai teks biasa.
 * Ini kunci lokal untuk mencegah perubahan tak sengaja, bukan autentikasi server:
 * siapa pun yang bisa membuka data browser perangkat ini tetap bisa membacanya.
 */
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
  const [hasPin, setHasPin] = useState(() => Boolean(read(PIN_KEY, localStorage)));
  const [isBendahara, setIsBendahara] = useState(
    () => Boolean(read(PIN_KEY, localStorage)) && read(SESSION_KEY, sessionStorage) === "1",
  );
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLogin = useCallback(() => setIsLoginOpen(true), []);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

  const setSession = useCallback((active: boolean) => {
    setIsBendahara(active);
    write(SESSION_KEY, active ? "1" : null, sessionStorage);
  }, []);

  const login = useCallback(async (pin: string) => {
    const stored = read(PIN_KEY, localStorage);
    if (!stored) return false;
    const matches = stored === (await hashPin(pin));
    if (matches) setSession(true);
    return matches;
  }, [setSession]);

  const savePin = useCallback(
    async (pin: string) => {
      write(PIN_KEY, await hashPin(pin), localStorage);
      setHasPin(true);
      setSession(true);
    },
    [setSession],
  );

  const logout = useCallback(() => setSession(false), [setSession]);

  const value = useMemo<AuthValue>(
    () => ({
      isBendahara,
      hasPin,
      isLoginOpen,
      openLogin,
      closeLogin,
      login,
      savePin,
      logout,
    }),
    [isBendahara, hasPin, isLoginOpen, openLogin, closeLogin, login, savePin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return auth;
}
