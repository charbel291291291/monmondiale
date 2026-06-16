"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
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

  if (!installPrompt || hidden || installed) return null;

  async function installApp() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] sm:bottom-6 sm:left-6">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-[#101b2b]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <button
          onClick={installApp}
          className="rounded-xl bg-amber-300 px-4 py-2 text-xs font-black text-black transition hover:bg-amber-200"
        >
          Install App
        </button>

        <div className="hidden text-xs text-white/45 sm:block">
          Add Mondial 2026 to your device
        </div>

        <button
          onClick={() => setHidden(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white/50 transition hover:bg-white/20 hover:text-white"
          aria-label="Hide install button"
        >
          ×
        </button>
      </div>
    </div>
  );
}