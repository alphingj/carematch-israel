import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, logout } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ConfirmModal } from '../components/ui/confirm-modal';
import Select from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, Phone, MapPin, Languages, Settings, FileText, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LANGUAGES = [
  { value: 'Hebrew', label: 'Hebrew' },
  { value: 'English', label: 'English' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Romanian', label: 'Romanian' },
  { value: 'Other', label: 'Other' }
];

export default function Profile() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [jobToDeactivate, setJobToDeactivate] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    languages: [] as any[],
    workArea: '',
    workRequest: ''
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        phone: profile.phone?.replace('+972', '') || '',
        languages: profile.languages?.map(l => ({ value: l, label: l })) || [],
        workArea: profile.workArea || 'All Area',
        workRequest: profile.workRequest || 'Reliever'
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'jobs'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      jobsData.sort((a: any, b: any) => {
        const getTime = (date: any) => {
          if (!date) return 0;
          if (date.toDate) return date.toDate().getTime();
          return new Date(date).getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
      setMyJobs(jobsData);
      setLoadingJobs(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
      setLoadingJobs(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleJobActive = async (jobId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { active: !currentStatus });
      setJobToDeactivate(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
    }
  };

  const handleToggleJobClick = (jobId: string, currentStatus: boolean) => {
    if (currentStatus) {
      setJobToDeactivate(jobId);
    } else {
      toggleJobActive(jobId, currentStatus);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setUpdatingStatus(true);
    try {
      const updates: any = {
        name: editForm.name,
        phone: '+972' + editForm.phone,
      };
      if (profile?.role === 'caregiver') {
        updates.languages = editForm.languages.map((l: any) => l.value);
        updates.workArea = editForm.workArea;
        updates.workRequest = editForm.workRequest;
      }
      await setDoc(doc(db, 'users', auth.currentUser.uid), updates, { merge: true });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isEmailAdmin = auth.currentUser?.email === 'alphingj@gmail.com' || auth.currentUser?.email === 'alphingrowthchannel@gmail.com';
  if (!profile && !isEmailAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('My Profile')}</h1>
        <p className="text-slate-500 mt-2">{t('Manage your personal information and job postings.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{t('Personal Info')}</CardTitle>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Settings className="w-4 h-4 mr-1" /> {t('Edit')}
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700">{t('Full Name')}</Label>
                  <Input 
                    value={editForm.name} 
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} 
                    className="h-10"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">{t('Phone Number')}</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-slate-50 text-slate-500 text-sm">
                      +972
                    </span>
                    <Input 
                      className="rounded-l-none h-10" 
                      value={editForm.phone} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('972')) val = val.substring(3);
                        if (val.startsWith('0')) val = val.substring(1);
                        setEditForm(prev => ({ ...prev, phone: val.slice(0, 9) }));
                      }} 
                      maxLength={10}
                      autoComplete="tel-national"
                    />
                  </div>
                </div>
                
                {profile?.role === 'caregiver' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-700">{t('Languages')}</Label>
                      <Select 
                        isMulti 
                        options={LANGUAGES.map(lang => ({ ...lang, label: t(lang.value) }))} 
                        value={editForm.languages.map(lang => ({ ...lang, label: t(lang.value) }))} 
                        onChange={(v) => setEditForm(prev => ({ ...prev, languages: v as any[] }))} 
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">{t('Work Area')}</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={editForm.workArea} 
                        onChange={e => setEditForm(prev => ({ ...prev, workArea: e.target.value }))}
                      >
                        <option value="Area 1">{t('Area 1')}</option>
                        <option value="Area 2">{t('Area 2')}</option>
                        <option value="Area 3">{t('Area 3')}</option>
                        <option value="All Area">{t('All Area')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">{t('Work Request')}</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={editForm.workRequest} 
                        onChange={e => setEditForm(prev => ({ ...prev, workRequest: e.target.value }))}
                      >
                        <option value="Permanent">{t('Permanent')}</option>
                        <option value="Reliever">{t('Reliever')}</option>
                        <option value="Register reliever">{t('Register reliever')}</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={handleSaveProfile} disabled={updatingStatus || !editForm.name || !editForm.phone} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {t('Save Changes')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    {t('Cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold uppercase">
                    {profile?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{profile?.name || 'Admin User'}</h2>
                    <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium capitalize mt-1">
                      {profile?.role ? t(profile.role) : 'Admin'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">{t('Phone')}</span>
                      <span className="text-slate-900">{profile?.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  {profile?.role === 'caregiver' && (
                    <>
                      <div className="flex items-start gap-3">
                        <Languages className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">{t('Languages')}</span>
                          <span className="text-slate-900">{profile.languages?.map((l: string) => t(l)).join(', ') || t('None')}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">{t('Work Area')}</span>
                          <span className="text-slate-900">{profile.workArea ? t(profile.workArea) : '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">{t('Work Request')}</span>
                          <span className="text-slate-900">{profile.workRequest ? t(profile.workRequest) : '-'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('Log Out')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Postings Card */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm h-fit">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{t('My Job Postings')}</CardTitle>
            </div>
            <Link to="/jobs/create">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-full px-4">{t('Post New Job')}</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loadingJobs ? (
              <div className="text-center py-12 text-slate-500">{t('Loading your jobs...')}</div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t('No jobs posted yet')}</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">{t('You haven\'t created any job postings. When you do, they will appear here.')}</p>
                <Link to="/jobs/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-full">{t('Create Your First Job')}</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myJobs.map(job => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors gap-4">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="font-semibold text-lg text-blue-600 hover:text-blue-700 hover:underline block mb-1">
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.jobType}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {t(job.area)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${job.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {job.active ? t('ACTIVE') : t('INACTIVE')}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleJobClick(job.id, job.active)}
                        className="h-8 text-xs font-medium"
                      >
                        {job.active ? t('Deactivate') : t('Reactivate')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmModal 
        isOpen={!!jobToDeactivate}
        title={t('Deactivate Job Posting')}
        message={t('Are you sure you want to deactivate this job posting? It will no longer be visible on the job board.')}
        confirmText={t('Yes, Deactivate')}
        onConfirm={() => jobToDeactivate && toggleJobActive(jobToDeactivate, true)}
        onCancel={() => setJobToDeactivate(null)}
      />
    </div>
  );
}
