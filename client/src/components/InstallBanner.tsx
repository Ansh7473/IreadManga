import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "irm:pwaDismiss";

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1",
  );

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (hidden || !deferred) return null;

  async function install() {
    await deferred!.prompt();
    await deferred!.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
    setDeferred(null);
  }

  return (
    <div className="install-banner" role="region" aria-label="Install app">
      <div>
        <strong>Add to Home Screen</strong>
        <p>Open I Read Manga like an app — faster return visits.</p>
      </div>
      <div className="install-banner-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={install}>
          Install
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
