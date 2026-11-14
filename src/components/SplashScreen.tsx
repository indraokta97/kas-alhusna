import { useEffect, useState } from "react";

/**
 * Muncul setiap halaman dimuat ulang, bukan sekali per sesi tab: pengguna
 * memakai aplikasi ini lewat refresh atau membuka tautan, jadi layar sambutan
 * perlu terlihat lagi sebagai penanda sedang memuat.
 */
export function SplashScreen() {
  const [hidden, setHidden] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? 900 : 1600;
    const fade = reduced ? 0 : 360;

    const fadeTimer = window.setTimeout(() => setLeaving(true), hold);
    const hideTimer = window.setTimeout(() => setHidden(true), hold + fade);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] grid place-items-center bg-canvas transition-opacity duration-300 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center px-6 pb-8 text-center">
        <img
          src="/ropik-1.webp"
          alt=""
          aria-hidden="true"
          width={479}
          height={509}
          className="h-[190px] w-auto object-contain"
        />
        <p className="mt-2 max-w-[300px] text-balance text-[23px] font-extrabold leading-tight tracking-tight text-ink">
          Halo! Selamat Datang di Kas Remasna!
        </p>
        <span aria-hidden="true" className="mt-7 h-1 w-16 overflow-hidden rounded-full bg-line">
          <span className="splash-bar block h-full w-1/2 rounded-full bg-brand" />
        </span>
      </div>
    </div>
  );
}
