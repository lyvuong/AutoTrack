import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short">
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/50 shadow-2xl bg-slate-900/95 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white">Install AutoTrack App</h4>
            <p className="text-[11px] text-slate-300">Add to home screen for offline maintenance logging.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
