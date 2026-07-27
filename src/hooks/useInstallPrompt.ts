import { useState, useEffect } from 'react';

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const listeners = new Set<(e: PromptEvent) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    const pe = e as PromptEvent;
    listeners.forEach(fn => fn(pe));
  });
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<PromptEvent | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const handler = (e: PromptEvent) => {
      setDeferred(e);
      setResolved(false);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const prompt = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice;
    setResolved(true);
    if (result.outcome === 'accepted') setDeferred(null);
  };

  return { deferred, prompt, resolved };
}
