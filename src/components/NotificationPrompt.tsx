import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission } from '../lib/firebase';

export function NotificationPrompt() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!user || !profile?.onboardingCompleted) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    const key = `notif_prompt_${user.uid}`;
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => setDismissed(false), 3000);
    return () => clearTimeout(timer);
  }, [user, profile]);

  const handleEnable = async () => {
    await requestNotificationPermission();
    setDismissed(true);
  };

  const handleDismiss = () => {
    if (user) localStorage.setItem(`notif_prompt_${user.uid}`, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-bold text-slate-900">Stay Updated</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Get notified when new jobs match your preferences.
          </p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleEnable} className="bg-blue-600 hover:bg-blue-700 rounded-full px-5 h-9 text-xs font-semibold">
              Enable Notifications
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
