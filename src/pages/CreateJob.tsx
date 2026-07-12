import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileText, User, Phone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function CreateJob() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (profile?.role === 'caregiver') {
    return (
      <div className="p-8 text-center text-red-600">
        Caregivers are not permitted to post job listings.
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    jobType: '',
    patientGender: '',
    patientAge: '',
    languages: [] as string[],
    area: 'Area 1',
    livingAtHome: 'Lives Alone',
    livingAtHomeOther: '',
    pets: 'None',
    petsOther: '',
    mentalState: 'Clear mind',
    movement: 'Independent',
    careNeeds: '',
    contactName: '',
    contactPhone: '',
    contactMethod: 'Whatsapp Only',
    isUrgent: false,
    visaStatus: 'With',
    foodMoney: 'Yes'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => {
      const isSelected = prev.languages.includes(lang);
      return {
        ...prev,
        languages: isSelected ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSubmitting(true);

    try {
      const newJobRef = doc(collection(db, 'jobs'));
      
      const finalLivingAtHome = formData.livingAtHome === 'Others (specify)' ? formData.livingAtHomeOther : formData.livingAtHome;
      const finalPets = formData.pets === 'Others' ? formData.petsOther : formData.pets;

      await setDoc(newJobRef, {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        jobType: formData.jobType,
        patientGender: formData.patientGender,
        patientAge: parseInt(formData.patientAge, 10) || 0,
        languages: formData.languages,
        area: formData.area,
        livingAtHome: finalLivingAtHome,
        pets: finalPets,
        mentalState: formData.mentalState,
        movement: formData.movement,
        careNeeds: formData.careNeeds,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        contactMethod: formData.contactMethod,
        isUrgent: formData.isUrgent,
        visaStatus: formData.visaStatus,
        foodMoney: formData.foodMoney,
        ownerId: auth.currentUser.uid,
        active: true,
        createdAt: serverTimestamp()
      });
      navigate('/jobs');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'jobs');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t('Post a Job')}</h1>
        <p className="text-slate-500 mt-2">{t('Fill out the details below to find the right caregiver.')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Basic Info Section */}
            <div className="p-8 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-xl text-slate-900">{t('Basic Information')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">{t('Job Title')}</Label>
                  <Input name="title" value={formData.title} onChange={handleChange} placeholder={t('e.g. Looking for caregiver Female Reliever')} required className="h-11" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer p-4 border border-red-100 bg-red-50 rounded-lg">
                    <input 
                      type="checkbox" 
                      name="isUrgent"
                      checked={formData.isUrgent}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-600"
                    />
                    <div>
                      <span className="text-sm font-bold text-red-700 block">{t('Mark as Urgent')}</span>
                      <span className="text-xs text-red-600">{t('This will highlight your job posting to attract immediate attention.')}</span>
                    </div>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Start Date')}</Label>
                  <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('End Date')}</Label>
                  <Input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Job Type')}</Label>
                  <Input name="jobType" value={formData.jobType} onChange={handleChange} placeholder={t('e.g. 24/7, Weekend')} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Area')}</Label>
                  <select 
                    name="area"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.area} 
                    onChange={handleChange}
                    required
                  >
                    <option value="Area 1">{t('Area 1')}</option>
                    <option value="Area 2">{t('Area 2')}</option>
                    <option value="Area 3">{t('Area 3')}</option>
                    <option value="All Area">{t('All Area')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Visa Status')}</Label>
                  <select 
                    name="visaStatus"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.visaStatus} 
                    onChange={handleChange}
                    required
                  >
                    <option value="With">{t('With')}</option>
                    <option value="Without">{t('Without')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Food Money')}</Label>
                  <select 
                    name="foodMoney"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.foodMoney} 
                    onChange={handleChange}
                    required
                  >
                    <option value="Yes">{t('Yes')}</option>
                    <option value="No">{t('No')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Patient Info Section */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-xl text-slate-900">{t('Patient Details')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Patient Gender')}</Label>
                  <Input name="patientGender" value={formData.patientGender} onChange={handleChange} placeholder={t('e.g. Female')} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Patient Age')}</Label>
                  <Input type="number" name="patientAge" value={formData.patientAge} onChange={handleChange} placeholder="e.g. 85" className="h-11" required min="1" max="140" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">{t('Languages Needed')}</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Hebrew', 'English', 'Russian', 'Romanian', 'Other'].map(lang => (
                      <label key={lang} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleLanguageToggle(lang)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm text-slate-700">{t(lang)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Living Arrangement')}</Label>
                  <select 
                    name="livingAtHome"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.livingAtHome} 
                    onChange={handleChange}
                  >
                    <option value="Lives Alone">{t('Lives Alone')}</option>
                    <option value="Lives with Family member">{t('Lives with Family member')}</option>
                    <option value="Lives with Spouse">{t('Lives with Spouse')}</option>
                    <option value="Others (specify)">{t('Others (specify)')}</option>
                  </select>
                  {formData.livingAtHome === 'Others (specify)' && (
                    <Input 
                      name="livingAtHomeOther" 
                      value={formData.livingAtHomeOther} 
                      onChange={handleChange} 
                      placeholder={t('Specify living arrangement...')} 
                      className="h-11 mt-2" 
                      maxLength={80}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Pets')}</Label>
                  <select 
                    name="pets"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.pets} 
                    onChange={handleChange}
                  >
                    <option value="None">{t('None')}</option>
                    <option value="Cat">{t('Cat')}</option>
                    <option value="Dog">{t('Dog')}</option>
                    <option value="Both">{t('Both')}</option>
                    <option value="Others">{t('Others')}</option>
                  </select>
                  {formData.pets === 'Others' && (
                    <Input 
                      name="petsOther" 
                      value={formData.petsOther} 
                      onChange={handleChange} 
                      placeholder={t('Specify pets...')} 
                      className="h-11 mt-2" 
                      maxLength={20}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Mental State')}</Label>
                  <select 
                    name="mentalState"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.mentalState} 
                    onChange={handleChange}
                  >
                    <option value="Clear mind">{t('Clear mind')}</option>
                    <option value="Not clear">{t('Not clear')}</option>
                    <option value="Partial">{t('Partial')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Movement')}</Label>
                  <select 
                    name="movement"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.movement} 
                    onChange={handleChange}
                  >
                    <option value="Independent">{t('Independent')}</option>
                    <option value="Walking Stick">{t('Walking Stick')}</option>
                    <option value="Helihon">{t('Helihon')}</option>
                    <option value="Wheel Chair">{t('Wheel Chair')}</option>
                    <option value="Manof">{t('Manof')}</option>
                    <option value="Bedridden">{t('Bedridden')}</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">{t('Care Needs / Diagnosis')}</Label>
                  <Input name="careNeeds" value={formData.careNeeds} onChange={handleChange} placeholder={t('e.g. Dementia, needs help with bathing')} className="h-11" />
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="p-8 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-xl text-slate-900">{t('Contact Information')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Contact Name & Relation')}</Label>
                  <Input name="contactName" value={formData.contactName} onChange={handleChange} placeholder={t('e.g. Sarah (Daughter)')} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">{t('Contact Phone')}</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-slate-50 text-slate-500 text-sm">
                      +972
                    </span>
                    <Input 
                      className="rounded-l-none h-11" 
                      name="contactPhone"
                      value={formData.contactPhone} 
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.startsWith('972')) val = val.substring(3);
                        if (val.startsWith('0')) val = val.substring(1);
                        setFormData(prev => ({ ...prev, contactPhone: val.slice(0, 9) }));
                      }} 
                      placeholder="541234567"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">{t('Contact Method')}</Label>
                  <select 
                    name="contactMethod"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.contactMethod} 
                    onChange={handleChange}
                  >
                    <option value="Whatsapp Only">{t('Whatsapp Only')}</option>
                    <option value="Call only">{t('Call only')}</option>
                    <option value="Both">{t('Both')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <Button type="button" variant="outline" className="h-11 px-6 rounded-full" onClick={() => navigate('/jobs')}>{t('Cancel')}</Button>
              <Button type="submit" disabled={loading} className="h-11 px-8 rounded-full bg-blue-600 hover:bg-blue-700">
                {loading ? t('Posting...') : t('Post Job')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
