import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { MapPin, Calendar, Clock, User, Phone, Info, ArrowLeft, MessageCircle, HeartPulse, Home, Languages, Activity, Share2, AlertCircle, FileText, Coffee } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [job, setJob] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); setError('Missing job ID'); return; }

    getDoc(doc(db, 'jobs', id))
      .then(snap => {
        if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
        else setError('Job not found');
      })
      .catch(err => {
        console.error('Failed to load job:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isEmailAdmin = auth.currentUser?.emailVerified && (auth.currentUser?.email === 'alphingj@gmail.com' || auth.currentUser?.email === 'alphingrowthchannel@gmail.com');
  const isAdmin = profile?.role === 'admin' || isEmailAdmin;
  const isOwner = job ? auth.currentUser?.uid === job.ownerId : false;
  const canEdit = isOwner || isAdmin;

  const isUrgent = useMemo(() => {
    if (!job) return false;
    if (!job.active) return false;
    if (job.isUrgent) return true;
    if (!job.startDate) return false;
    const start = new Date(job.startDate);
    if (isNaN(start.getTime())) return false;
    const diffDays = Math.ceil((start.getTime() - Date.now()) / 86400000);
    return diffDays >= -7 && diffDays <= 7;
  }, [job?.startDate, job?.active, job?.isUrgent, job]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="p-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <div className="p-8 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-24 max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('Job Not Found')}</h2>
        <p className="text-slate-500 mb-6">{t('This job posting may have been removed or you might have an invalid link.')}</p>
        <Button onClick={() => navigate('/jobs')} className="rounded-full px-8">{t('Back to Job Board')}</Button>
      </div>
    );
  }

  const phoneStr = (job.contactPhone || '').replace(/^0+/, '');
  const whatsappUrl = `https://wa.me/972${phoneStr}`;
  const callUrl = `tel:+972${phoneStr}`;

  const showCall = job.contactMethod === 'Call only' || job.contactMethod === 'Both';
  const showWhatsapp = job.contactMethod === 'Whatsapp Only' || job.contactMethod === 'Both' || !job.contactMethod;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full px-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('Back to Jobs')}
        </Button>
        <div className="flex items-center gap-3">
          {isUrgent && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-sm font-bold rounded-full border border-red-100">
              <AlertCircle className="w-4 h-4" />
              {t('Urgent')}
            </span>
          )}
          <Button variant="outline" onClick={() => {
            const url = window.location.href;
            if (navigator.share) navigator.share({ title: job.title, text: `Check out this caregiver job on CareMatch Israel: ${job.title}`, url });
            else navigator.clipboard.writeText(url).then(() => alert(t('Link copied to clipboard!')));
          }} className="rounded-full px-4 text-slate-700 border-slate-200 hover:bg-slate-50">
            <Share2 className="w-4 h-4 mr-2" />
            {t('Share Job')}
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${job.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {job.active ? t('ACTIVE') : t('INACTIVE')}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {job.patientGender} {t('Caregiver')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{job.title || ''}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 font-medium">
            <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-slate-400" /> {t(job.area)}{job.place ? ` — ${job.place}` : ''}</span>
            <span className="flex items-center gap-2"><Clock className="h-5 w-5 text-slate-400" /> {job.jobType || ''}</span>
            <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-slate-400" /> {job.startDate || ''}{job.endDate ? ` — ${job.endDate}` : ''}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 space-y-6 bg-slate-50/30">
              <h2 className="font-semibold text-xl flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                {t('Patient Details')}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">{t('Gender & Age')}</span>
                  <span className="font-medium text-slate-900">{t(job.patientGender)}, {job.patientAge}y</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">{t('Mental State')}</span>
                  <span className="font-medium text-slate-900">{job.mentalState ? t(job.mentalState) : (job.clearMind ? t('Clear mind') : t('Not clear'))}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">{t('Movement')}</span>
                  <span className="font-medium text-slate-900 text-right max-w-[60%]">{job.movement ? t(job.movement) : '-'}</span>
                </div>
                <div className="py-2">
                  <span className="text-slate-500 block mb-1">{t('Care Needs / Diagnosis')}</span>
                  <span className="font-medium text-slate-900 block">{job.careNeeds || '-'}</span>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6 bg-white">
              <h2 className="font-semibold text-xl flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Info className="h-5 w-5" />
                </div>
                {t('Job Requirements')}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2"><Languages className="w-4 h-4" /> {t('Languages')}</span>
                  <span className="font-medium text-slate-900 text-right max-w-[60%]">{(job.languages || []).map((l: string) => t(l)).join(', ') || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2"><Home className="w-4 h-4" /> {t('Living at home')}</span>
                  <span className="font-medium text-slate-900 text-right max-w-[60%]">{job.livingAtHome ? t(job.livingAtHome) : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2"><HeartPulse className="w-4 h-4" /> {t('Pets')}</span>
                  <span className="font-medium text-slate-900 text-right max-w-[60%]">{job.pets ? t(job.pets) : t('None')}</span>
                </div>
                {job.visaStatus && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2"><FileText className="w-4 h-4" /> {t('Visa Status')}</span>
                    <span className="font-medium text-slate-900 text-right max-w-[60%]">{t(job.visaStatus)}</span>
                  </div>
                )}
                {job.foodMoney && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2"><Coffee className="w-4 h-4" /> {t('Food Money')}</span>
                    <span className="font-medium text-slate-900 text-right max-w-[60%]">{t(job.foodMoney)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-8 bg-green-50 border-t border-green-100">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-semibold text-xl flex items-center gap-3 text-green-900 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <Phone className="h-5 w-5" />
                </div>
                {t('Contact Information')}
              </h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <p className="text-lg font-bold text-slate-900">{job.contactName || ''}</p>
                  <p className="text-slate-600 font-medium">{job.contactPhone || ''}</p>
                  {job.contactMethod && (
                    <p className="text-sm text-slate-500 flex items-center justify-center md:justify-start gap-1 mt-2">
                      <Info className="w-4 h-4" /> {job.contactMethod}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {showCall && (
                    <a href={callUrl} className="w-full sm:w-auto">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-12 px-8 shadow-md shadow-orange-200 text-base font-semibold">
                        <Phone className="w-5 h-5 mr-2" />
                        {t('Call')}
                      </Button>
                    </a>
                  )}
                  {showWhatsapp && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                      <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-12 px-8 shadow-md shadow-green-200 text-base font-semibold">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {t('WhatsApp')}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
