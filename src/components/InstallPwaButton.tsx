"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneApp() {
  if (typeof window === "undefined") return false;

  const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;

  return standaloneDisplay || iosStandalone;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneApp());
    setMobile(isMobileDevice());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (hidden || installed) return null;

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setHidden(true);
      }

      return;
    }

    setShowHelp((value) => !value);
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-6 sm:w-auto sm:max-w-none sm:translate-x-0">
      <div className="rounded-2xl border border-amber-300/20 bg-[#101b2b]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={installApp}
            className="flex-1 rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-black text-black transition hover:bg-amber-200 sm:flex-none"
          >
            Install App
          </button>

          <div className="hidden text-xs text-white/45 sm:block">
            Add Mondial 2026 to your device
          </div>

          <button
            onClick={() => setHidden(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white/50 transition hover:bg-white/20 hover:text-white"
            aria-label="Hide install button"
          >
            ×
          </button>
        </div>

        {showHelp && (
          <div className="mt-3 rounded-xl bg-black/25 p-3 text-xs leading-5 text-white/60">
            {mobile ? (
              <>
                On Android Chrome: tap menu, then Add to Home screen or Install app.
                <br />
                On iPhone Safari: tap Share, then Add to Home Screen.
              </>
            ) : (
              <>
                Open this website on mobile, then use your browser menu to install it.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}