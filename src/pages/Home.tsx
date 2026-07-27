import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, loginWithGoogle } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Users, Briefcase, UserCheck, ArrowRight, PlusCircle, HeartHandshake } from 'lucide-react';
import { JobCard } from '../components/JobCard';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ caregivers: 0, openJobs: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const isEmailAdmin = user?.email === 'alphingj@gmail.com' || user?.email === 'alphingrowthchannel@gmail.com';

  useEffect(() => {
    if (!loading && user && !isEmailAdmin && (!profile || !profile.onboardingCompleted)) {
      navigate('/onboarding');
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setStatsLoading(false);
        return;
      }
      try {
        const caregiversQuery = query(collection(db, 'users'), where('role', '==', 'caregiver'));
        const caregiversSnap = await getCountFromServer(caregiversQuery);

        const jobsQuery = query(collection(db, 'jobs'), where('active', '==', true));
        const jobsSnap = await getCountFromServer(jobsQuery);

        setStats({
          caregivers: caregiversSnap.data().count,
          openJobs: jobsSnap.data().count
        });

        const recentJobsQuery = query(collection(db, 'jobs'), where('active', '==', true));
        const recentJobsSnap = await getDocs(recentJobsQuery);
        const jobsData = recentJobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        jobsData.sort((a: any, b: any) => {
          const getTime = (date: any) => {
            if (!date) return 0;
            if (date.toDate) return date.toDate().getTime();
            return new Date(date).getTime();
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
        setRecentJobs(jobsData.slice(0, 3));
        setJobsLoading(false);
      } catch (error) {
        console.error("Error fetching stats", error);
        setJobsLoading(false);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="relative text-center space-y-8 py-24 px-4 bg-gradient-to-b from-blue-50 to-white rounded-3xl border border-blue-100 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-4">
              <HeartHandshake className="w-4 h-4" />
              <span>{t('Connecting Caregivers & Families in Israel')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {t('home.title')}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-200 transition-all" onClick={loginWithGoogle}>
                {t('home.join')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t('For Families')}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t('Find trusted, experienced caregivers for your loved ones. Post jobs and connect directly with qualified professionals.')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t('For Caregivers')}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t('Discover permanent and reliever job opportunities across Israel. Manage your profile and availability easily.')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t('Direct Connection')}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t('No middlemen. Communicate directly via WhatsApp or phone to arrange interviews and finalize details.')}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('Dashboard')}</h1>
          <p className="text-slate-500 mt-2 text-lg">{t('Find and post caregiver relief jobs across Israel')}</p>
        </div>
        <Button onClick={() => navigate('/jobs/create')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 text-base shadow-md shadow-blue-200">
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('Post a Job')}
        </Button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(isEmailAdmin || profile?.role === 'admin') && (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : stats.caregivers}
                </div>
                <div className="text-sm text-slate-500 font-medium">{t('Registered Caregivers')}</div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/jobs')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {statsLoading ? "..." : stats.openJobs}
              </div>
              <div className="text-sm text-slate-500 font-medium">{t('Open Jobs')}</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">{t('Recent Open Jobs')}</h2>
          <Link to="/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
            {t('View all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {jobsLoading ? (
          <div className="text-center py-12 text-slate-500">{t('Loading jobs...')}</div>
        ) : recentJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">{t('No open jobs found.')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
