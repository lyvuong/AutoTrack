import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOSorIPad, setIsIOSorIPad] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode already
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS / iPadOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice) {
      setIsIOSorIPad(true);
      // Show prompt if not dismissed recently
      const dismissed = localStorage.getItem('autotrack_pwa_ios_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOSorIPad) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    if (isIOSorIPad) {
      localStorage.setItem('autotrack_pwa_ios_dismissed', 'true');
    }
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short">
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/50 shadow-2xl bg-slate-900/95 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/apple-touch-icon.png" 
              alt="AutoTrack App Icon" 
              className="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 object-cover shrink-0" 
            />
            <div>
              <h4 className="text-xs font-extrabold text-white">Install AutoTrack App</h4>
              <p className="text-[11px] text-slate-300">Add to home screen for offline maintenance logging.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSInstructions && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2">
            <Share className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-semibold text-white">To install on iPad or iPhone:</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Tap Safari's <span className="font-bold text-white">Share button</span> (square with arrow up), then select <span className="font-bold text-cyan-300">"Add to Home Screen"</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
