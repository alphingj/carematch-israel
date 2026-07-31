import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface EditJobModalProps {
  job: any;
  onClose: () => void;
  onSaved: () => void;
}

export function EditJobModal({ job, onClose, onSaved }: EditJobModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...job });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageToggle = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages?.includes(lang)
        ? prev.languages.filter((l: string) => l !== lang)
        : [...(prev.languages || []), lang]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      const fields = [
        'title', 'startDate', 'endDate', 'jobType', 'area', 'place',
        'patientGender', 'patientAge', 'languages', 'livingAtHome',
        'pets', 'mentalState', 'movement', 'careNeeds',
        'contactName', 'contactPhone', 'contactMethod',
        'visaStatus', 'foodMoney', 'isUrgent'
      ];
      fields.forEach(f => {
        if (form[f] !== undefined) updates[f] = form[f];
      });
      if (typeof updates.patientAge === 'string') updates.patientAge = parseInt(updates.patientAge, 10) || 0;
      await updateDoc(doc(db, 'jobs', job.id), updates);
      onSaved();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${job.id}`);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto pt-10">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Job</h2>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input name="title" value={form.title || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <input name="startDate" value={form.startDate || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <input name="endDate" value={form.endDate || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Job Type</label>
              <input name="jobType" value={form.jobType || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Area</label>
              <select name="area" value={form.area || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Area 1">Area 1</option>
                <option value="Area 2">Area 2</option>
                <option value="Area 3">Area 3</option>
                <option value="All Area">All Area</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Place</label>
              <input name="place" value={form.place || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Visa Status</label>
              <select name="visaStatus" value={form.visaStatus || 'With'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="With">With</option>
                <option value="Without">Without</option>
                <option value="With/Without">With/Without</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Food Money</label>
              <select name="foodMoney" value={form.foodMoney || 'Yes'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Patient Gender</label>
              <input name="patientGender" value={form.patientGender || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Patient Age</label>
              <input name="patientAge" value={form.patientAge || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Languages</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {['Hebrew', 'English', 'Russian', 'Romanian', 'Other'].map(lang => (
                  <label key={lang} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked={(form.languages || []).includes(lang)} onChange={() => handleLanguageToggle(lang)} className="rounded" />
                    {lang}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Living Arrangement</label>
              <select name="livingAtHome" value={form.livingAtHome || 'Lives Alone'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Lives Alone">Lives Alone</option>
                <option value="Lives with Family member">Lives with Family member</option>
                <option value="Lives with Spouse">Lives with Spouse</option>
                <option value="Others (specify)">Others (specify)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Pets</label>
              <select name="pets" value={form.pets || 'None'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="None">None</option>
                <option value="Cat">Cat</option>
                <option value="Dog">Dog</option>
                <option value="Both">Both</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Mental State</label>
              <select name="mentalState" value={form.mentalState || 'Clear mind'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Clear mind">Clear mind</option>
                <option value="Not clear">Not clear</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Movement</label>
              <select name="movement" value={form.movement || 'Independent'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Independent">Independent</option>
                <option value="Walking Stick">Walking Stick</option>
                <option value="Helihon">Helihon</option>
                <option value="Wheel Chair">Wheel Chair</option>
                <option value="Manof">Manof</option>
                <option value="Bedridden">Bedridden</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Care Needs / Diagnosis</label>
              <input name="careNeeds" value={form.careNeeds || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Contact Name</label>
              <input name="contactName" value={form.contactName || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Contact Phone</label>
              <input name="contactPhone" value={form.contactPhone || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Contact Method</label>
              <select name="contactMethod" value={form.contactMethod || 'Whatsapp Only'} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Whatsapp Only">Whatsapp Only</option>
                <option value="Call only">Call only</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.isUrgent} onChange={e => setForm(prev => ({ ...prev, isUrgent: e.target.checked }))} className="rounded" />
                <span className="font-medium text-slate-700">Mark as Urgent</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 rounded-full">{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
