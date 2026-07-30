import React, { useState, useEffect } from 'react';
import { DownloadCloud01, XClose } from '@untitledui/icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaModalProps {
  showFloatingButton?: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ showFloatingButton = true }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Detect if already installed / running in standalone window
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(inStandalone);

    // Detect iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for native Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIosGuide(true);
    }
  };

  if (isStandalone) return null;

  // Render on mobile devices when prompt available or on iOS
  return (
    <>
      {/* Floating Mobile Install App Button */}
      {showFloatingButton && (deferredPrompt || isIOS) && !showIosGuide && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 border border-white/20"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            <DownloadCloud01 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            Install Shotage App
          </button>
        </div>
      )}

      {/* iOS Beginner Friendly Step-by-Step Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <img src="/shotage-logo-small.png" alt="Shotage" className="w-6 h-6" />
                <h3 className="font-bold text-slate-100 text-sm">Install Shotage App</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <XClose className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install Shotage directly on your iPhone / iPad home screen for 1-click access:
            </p>

            <div className="space-y-2.5 text-left bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span className="text-slate-200">
                  Tap the <strong className="text-pastel-pink">Share</strong> button at the bottom
                  of Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span className="text-slate-200">
                  Scroll down and tap{' '}
                  <strong className="text-pastel-pink">"Add to Home Screen"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <span className="text-slate-200">
                  Tap <strong className="text-pastel-pink">"Add"</strong> in top right corner.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
