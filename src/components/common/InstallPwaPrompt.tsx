import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone display mode
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Check if dismissed previously in session
    const dismissed = sessionStorage.getItem('money_vedass_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 4. Capture Chromium beforeinstallprompt event (Android & Chrome / Edge desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Detect app installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      console.log('[Money Vedass PWA] App installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('money_vedass_pwa_dismissed', 'true');
  };

  // Do not show if already installed in standalone mode or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show if Chrome/Edge install prompt is available OR if on iOS device
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating PWA Install Banner */}
      <div
        className="fixed right-4 left-4 md:left-auto md:w-96 z-40 bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl shadow-2xl p-4 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 md:bottom-6"
        style={{
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Money Vedass" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">Install Money Vedass</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Fast App
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Add to your home screen for full-screen view, faster load times & offline ledger access.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
          <button
            onClick={handleDismiss}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
          >
            Not now
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={14} strokeWidth={2.5} />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-300 mb-4 leading-relaxed">
              Apple Safari lets you install web apps directly without downloading from the App Store:
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 size={13} />
                </div>
                <div className="text-slate-200">
                  <strong className="text-white block font-semibold mb-0.5">1. Tap the Share button</strong>
                  Located at the bottom bar of Safari (the square with an arrow pointing up).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare size={13} />
                </div>
                <div className="text-slate-200">
                  <strong className="text-white block font-semibold mb-0.5">2. Tap 'Add to Home Screen'</strong>
                  Scroll down the share menu options and tap <span className="text-emerald-400 font-medium">Add to Home Screen</span>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={13} />
                </div>
                <div className="text-slate-200">
                  <strong className="text-white block font-semibold mb-0.5">3. Tap 'Add' in top right</strong>
                  Money Vedass will appear right on your home screen like a native app.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
