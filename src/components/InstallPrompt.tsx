import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const uid = 'install_prompt_dismissed';
      if (localStorage.getItem(uid)) return;
      setTimeout(() => setShow(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('install_prompt_dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-slate-900">Install CareMatch</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Install as an app for the best experience with offline support and faster access.
          </p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700 rounded-full px-5 h-9 text-xs font-semibold">
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-slate-500 h-9 px-3 text-xs">
              Not now
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
