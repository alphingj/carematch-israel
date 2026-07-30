import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, loginWithGoogle } from '../lib/firebase';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, PlusCircle, LogIn } from 'lucide-react';
import { JobCard } from '../components/JobCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function JobBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory since we need an index for orderBy with where
      jobsData.sort((a: any, b: any) => {
        const getTime = (date: any) => {
          if (!date) return 0;
          if (date.toDate) return date.toDate().getTime();
          return new Date(date).getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredJobs = jobs.filter(job => {
    if (areaFilter && job.area !== areaFilter && job.area !== 'All Area') return false;
    if (typeFilter && !job.jobType?.toLowerCase().includes(typeFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('Job Board')}</h1>
          <p className="text-slate-500 mt-2 text-lg">{t('Browse and filter available caregiver positions')}</p>
        </div>
        {user ? (
          <Link to="/jobs/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 text-base shadow-md shadow-blue-200">
              <PlusCircle className="w-5 h-5 mr-2" />
              {t('Post a Job')}
            </Button>
          </Link>
        ) : (
          <Button onClick={loginWithGoogle} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 text-base shadow-md shadow-blue-200">
            <LogIn className="w-5 h-5 mr-2" />
            {t('nav.login')}
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              {t('Filter by Area')}
            </label>
            <select 
              className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="">{t('All Areas')}</option>
              <option value="Area 1">{t('Area 1')}</option>
              <option value="Area 2">{t('Area 2')}</option>
              <option value="Area 3">{t('Area 3')}</option>
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              {t('Filter by Job Type')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder={t('e.g. 24/7, Reliever')}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 pl-9 bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-slate-200 shadow-sm animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('No jobs found')}</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {t('We couldn\'t find any active jobs matching your current filters. Try adjusting your search criteria.')}
          </p>
          {(areaFilter || typeFilter) && (
            <Button 
              variant="outline" 
              className="mt-6 rounded-full"
              onClick={() => { setAreaFilter(''); setTypeFilter(''); }}
            >
              {t('Clear Filters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
