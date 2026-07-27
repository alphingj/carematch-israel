import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, Users, Briefcase, Trash2, TrendingUp, MapPin, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function getDateStr(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getTime(date: any): number {
  if (!date) return 0;
  if (date.toDate) return date.toDate().getTime();
  return new Date(date).getTime();
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  return new Date(getTime(date)).toLocaleDateString();
}

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      usersData.sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubscribeJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      jobsData.sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt));
      setJobs(jobsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    return () => {
      unsubscribeUsers();
      unsubscribeJobs();
    };
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'jobs', jobId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `jobs/${jobId}`);
      }
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { active: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
    }
  };

  const caregiversCount = users.filter(u => u.role === 'caregiver').length;
  const residentsCount = users.filter(u => u.role === 'resident').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;
  const activeJobs = jobs.filter(j => j.active).length;

  const userTrend = useMemo(() => {
    const now = Date.now();
    const DAY_MS = 86400000;
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY_MS);
      d.setHours(0, 0, 0, 0);
      return { label: getDateStr(d), date: d, users: 0, jobs: 0 };
    });

    users.forEach(u => {
      const t = getTime(u.createdAt);
      const idx = days.findIndex(d => t >= d.date.getTime() && t < d.date.getTime() + DAY_MS);
      if (idx >= 0) days[idx].users++;
    });

    jobs.forEach(j => {
      const t = getTime(j.createdAt);
      const idx = days.findIndex(d => t >= d.date.getTime() && t < d.date.getTime() + DAY_MS);
      if (idx >= 0) days[idx].jobs++;
    });

    return days;
  }, [users, jobs]);

  const jobsByArea = useMemo(() => {
    const areas: Record<string, number> = {};
    jobs.forEach(j => {
      const a = j.area || 'Unknown';
      areas[a] = (areas[a] || 0) + 1;
    });
    return Object.entries(areas).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  const nationalities = useMemo(() => {
    const counts: Record<string, number> = {};
    users.filter(u => u.role === 'caregiver').forEach(u => {
      const n = u.nationality || 'Unknown';
      counts[n] = (counts[n] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  if (loading) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
        <Shield className="h-8 w-8 text-blue-600" /> Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{users.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Caregivers</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{caregiversCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Residents</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{residentsCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Jobs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{jobs.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Active Jobs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{activeJobs}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="w-5 h-5 text-blue-600" /> 7-Day Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userTrend}>
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" name="New Users" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="jobs" name="New Jobs" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="w-5 h-5 text-blue-600" /> Jobs by Area</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsByArea.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400">No jobs yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={jobsByArea} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {jobsByArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Globe className="w-5 h-5 text-blue-600" /> Caregiver Nationalities</CardTitle>
          </CardHeader>
          <CardContent>
            {nationalities.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400">No caregivers yet</div>
            ) : (
              <div className="space-y-2">
                {nationalities.map((n, i) => (
                  <div key={n.name} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-slate-700 flex-1">{n.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{n.value}</span>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(n.value / Math.max(...nationalities.map(x => x.value)) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="w-5 h-5 text-blue-600" /> Job Status</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400">No jobs yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    { name: 'Active', value: activeJobs },
                    { name: 'Inactive', value: jobs.length - activeJobs }
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="#10b981" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Publisher</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className="border-b">
                    <td className="px-4 py-3 font-medium text-slate-900">{job.title}</td>
                    <td className="px-4 py-3">{users.find(u => u.uid === job.ownerId)?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{job.area}{job.place ? ` — ${job.place}` : ''}</td>
                    <td className="px-4 py-3">{job.jobType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {job.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => toggleJobStatus(job.id, job.active)} className="text-slate-600 border-slate-200">
                        {job.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'caregiver' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <select className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                        <option value="resident">Resident</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
