import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Calendar, Clock, User, MapPin, Activity, Phone, MessageCircle, Share2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function JobCard({ job }: { job: any }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isUrgent = React.useMemo(() => {
    if (!job.active) return false;
    if (job.isUrgent) return true;
    if (!job.startDate) return false;
    
    const start = new Date(job.startDate);
    if (isNaN(start.getTime())) return false;

    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Consider urgent if start date is within next 7 days or up to 7 days in the past (if still active)
    return diffDays >= -7 && diffDays <= 7;
  }, [job.startDate, job.active, job.isUrgent]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/jobs/${job.id}`;
    const shareData = {
      title: job.title,
      text: `Check out this caregiver job on CareMatch Israel: ${job.title}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert(t('Link copied to clipboard!'));
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer border-slate-200" 
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
            <div className="flex gap-2 mt-2">
              {job.active ? (
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                  {t('Active')}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full font-medium">
                  {t('Closed')}
                </span>
              )}
              <span className="px-2.5 py-0.5 border border-slate-200 text-slate-600 text-xs rounded-full font-medium bg-white">
                {t(job.patientGender)} {t('Caregiver')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUrgent && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100" title={t('Upcoming start date')}>
                <AlertCircle className="w-3 h-3" />
                {t('Urgent')}
              </span>
            )}
            <button 
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title={t('Share Job')}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2.5 text-sm text-slate-600 mt-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" /> 
            <span>{job.startDate} {job.endDate ? `— ${job.endDate}` : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" /> 
            <span>{job.jobType}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400" /> 
            <span>{t(job.patientGender)}, Age {job.patientAge}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400" /> 
            <span>{t(job.area)} {job.city ? `— ${job.city}` : ''}</span>
          </div>
          {job.careNeeds && (
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-slate-400" /> 
              <span className="truncate">{job.careNeeds}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm mt-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Phone className="w-4 h-4" /> 
            <span>{job.contactName?.split(' ')[0] || job.contactName || 'Contact'}</span>
          </div>
          {job.contactMethod && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <MessageCircle className="w-4 h-4" /> 
              <span>{job.contactMethod.toLowerCase().includes('whatsapp') ? 'WhatsApp' : job.contactMethod}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
