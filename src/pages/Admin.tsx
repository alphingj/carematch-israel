import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, Users, Briefcase, Trash2 } from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      usersData.sort((a: any, b: any) => {
        const getTime = (date: any) => {
          if (!date) return 0;
          if (date.toDate) return date.toDate().getTime();
          return new Date(date).getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubscribeJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      jobsData.sort((a: any, b: any) => {
        const getTime = (date: any) => {
          if (!date) return 0;
          if (date.toDate) return date.toDate().getTime();
          return new Date(date).getTime();
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
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

  if (loading) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  const caregiversCount = users.filter(u => u.role === 'caregiver').length;
  const residentsCount = users.filter(u => u.role === 'resident').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
        <Shield className="h-8 w-8 text-blue-600" /> Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Caregivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{caregiversCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{residentsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Jobs</CardTitle>
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
                    <td className="px-4 py-3">{job.area}</td>
                    <td className="px-4 py-3">{job.jobType}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {job.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.createdAt ? new Date(job.createdAt.toDate ? job.createdAt.toDate() : job.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleJobStatus(job.id, job.active)}
                        className="text-slate-600 border-slate-200"
                      >
                        {job.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteJob(job.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
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
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'caregiver' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.createdAt ? new Date(u.createdAt.toDate ? u.createdAt.toDate() : u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select 
                        className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white"
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
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
