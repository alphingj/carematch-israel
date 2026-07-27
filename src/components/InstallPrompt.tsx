import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useAuth } from '../contexts/AuthContext';

export function InstallPrompt() {
  const { user, profile } = useAuth();
  const { deferred, prompt, resolved } = useInstallPrompt();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!deferred) return;
    if (!user || !profile?.onboardingCompleted) return;
    const key = 'install_prompt_dismissed';
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [deferred, user, profile]);

  useEffect(() => {
    if (resolved) setShow(false);
  }, [resolved]);

  if (!show || !deferred) return null;

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
            <Button size="sm" onClick={prompt} className="bg-blue-600 hover:bg-blue-700 rounded-full px-5 h-9 text-xs font-semibold">
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShow(false); localStorage.setItem('install_prompt_dismissed', 'true'); }} className="text-slate-500 h-9 px-3 text-xs">
              Not now
            </Button>
          </div>
        </div>
        <button onClick={() => { setShow(false); localStorage.setItem('install_prompt_dismissed', 'true'); }} className="text-slate-400 hover:text-slate-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
