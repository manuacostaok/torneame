"use client";

import { useEffect, useState } from "react";

// Chrome/Android disparan este evento cuando la PWA cumple los
// requisitos de instalabilidad (manifest + service worker + https) — lo
// interceptamos para mostrar NUESTRO banner en vez del mini-infobar
// genérico del navegador, que la mayoría de la gente ni nota que existe.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "torneame:install-dismissed";

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem(DISMISSED_KEY);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (alreadyDismissed || isStandalone) return;

    const iosDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(iosDevice);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS Safari nunca dispara beforeinstallprompt — no hay forma de
    // detectar instalabilidad ahí, así que directamente le mostramos las
    // instrucciones manuales después de un rato de uso (no en el primer
    // segundo, que se sienta como un aviso invasivo apenas entra)
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (iosDevice) {
      iosTimer = setTimeout(() => setVisible(true), 15_000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    else dismiss(); // si dice que no, tampoco insistimos de nuevo
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm rounded-xl bg-surface-1 p-4 shadow-xl sm:inset-x-auto sm:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2">
          🕹️
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Instalá Torneame</p>
          {isIos ? (
            <p className="mt-1 text-xs text-secondary">
              Tocá <span className="font-medium">Compartir</span> y después{" "}
              <span className="font-medium">&ldquo;Agregar a pantalla de inicio&rdquo;</span>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-secondary">
              Acceso directo en tu pantalla de inicio, sin abrir el navegador.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {!isIos && (
              <button
                onClick={handleInstallClick}
                className="rounded-md bg-primary px-3 py-1.5 text-xs text-white"
              >
                Instalar
              </button>
            )}
            <button onClick={dismiss} className="rounded-md border border-strong px-3 py-1.5 text-xs">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
