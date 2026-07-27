import { useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const SEEN_KEY = 'job_alerts_seen';

function getSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markSeen(ids: string[]) {
  const seen = getSeen();
  ids.forEach(id => seen.add(id));
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export function useJobAlerts() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'caregiver' || !profile.onboardingCompleted) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const q = query(collection(db, 'jobs'), where('active', '==', true));
    let initial = true;

    const unsub = onSnapshot(q, snap => {
      if (initial) {
        initial = false;
        markSeen(snap.docs.map(d => d.id));
        return;
      }

      const newIds: string[] = [];
      const seen = getSeen();

      snap.docChanges().forEach(change => {
        if (change.type !== 'added') return;
        if (seen.has(change.doc.id)) return;
        const job = { id: change.doc.id, ...change.doc.data() } as { id: string; title?: string; area?: string };
        newIds.push(job.id);
        if (!job.title) return;
        if (job.area && job.area !== 'All Area' && profile.workArea && profile.workArea !== 'All Area' && job.area !== profile.workArea) return;

        const notif = new Notification('New Job Match!', {
          body: `${job.title} — ${job.area || ''}`.trim(),
          icon: '/apple-touch-icon.png',
        });
        notif.onclick = () => {
          window.open(`/jobs/${job.id}`, '_blank');
          notif.close();
        };
      });
      if (newIds.length) markSeen(newIds);
    });

    return () => unsub();
  }, [user, profile]);
}
