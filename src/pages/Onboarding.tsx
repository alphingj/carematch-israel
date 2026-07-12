import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Select from 'react-select';
import { useLanguage } from '../contexts/LanguageContext';

const NATIONALITIES = [
  'Philippines', 'India', 'Sri Lanka', 'Nepal', 'Moldova', 'Ukraine', 'Romania', 'Colombia', 'Other'
].map(n => ({ value: n, label: n }));

const LANGUAGES = [
  { value: 'Hebrew', label: 'Hebrew' },
  { value: 'English', label: 'English' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Romanian', label: 'Romanian' },
  { value: 'Other', label: 'Other' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'caregiver' | 'resident' | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [nationality, setNationality] = useState<{value: string, label: string} | null>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [drivingLicense, setDrivingLicense] = useState(false);
  const [workRequest, setWorkRequest] = useState<'Permanent' | 'Reliever' | 'Register reliever'>('Reliever');
  const [workArea, setWorkArea] = useState<'Area 1' | 'Area 2' | 'Area 3' | 'All Area'>('All Area');

  const handleNext = () => {
    if (step === 1 && role) {
      setStep(2);
    } else if (step === 2 && role === 'caregiver') {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userData: any = {
        role,
        name: name || auth.currentUser.displayName || 'Anonymous',
        phone: '+972' + phone,
        onboardingCompleted: true,
        createdAt: serverTimestamp()
      };

      if (role === 'caregiver') {
        userData.gender = gender;
        userData.nationality = nationality?.value || 'Other';
        userData.languages = languages.map(l => l.value);
        userData.drivingLicense = drivingLicense;
        userData.workRequest = workRequest;
        userData.workArea = workArea;
      }

      await setDoc(doc(db, 'users', auth.currentUser.uid), userData);
      navigate('/jobs');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('Complete Your Profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">{t('I am registering as a:')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant={role === 'caregiver' ? 'default' : 'outline'} 
                  className="h-24 text-lg"
                  onClick={() => setRole('caregiver')}
                >
                  {t('Caregiver')}
                </Button>
                <Button 
                  variant={role === 'resident' ? 'default' : 'outline'} 
                  className="h-24 text-lg"
                  onClick={() => setRole('resident')}
                >
                  {t('Israel Resident')}
                </Button>
              </div>
              <Button className="w-full mt-6" disabled={!role} onClick={handleNext}>{t('Next')}</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Full Name')}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>{t('Israel Phone Number')}</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    +972
                  </span>
                  <Input 
                    className="rounded-l-none" 
                    value={phone} 
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('972')) val = val.substring(3);
                      if (val.startsWith('0')) val = val.substring(1);
                      setPhone(val.slice(0, 9));
                    }} 
                    placeholder="541234567" 
                    maxLength={10}
                  />
                </div>
              </div>

              {role === 'caregiver' && (
                <>
                  <div className="space-y-2">
                    <Label>{t('Gender')}</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2"><input type="radio" checked={gender === 'Male'} onChange={() => setGender('Male')} /> {t('Male')}</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={gender === 'Female'} onChange={() => setGender('Female')} /> {t('Female')}</label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Nationality')}</Label>
                    <Select options={NATIONALITIES} value={nationality} onChange={setNationality} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Languages Spoken')}</Label>
                    <Select isMulti options={LANGUAGES.map(lang => ({ ...lang, label: t(lang.value) }))} value={languages} onChange={(v) => setLanguages(v as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <input type="checkbox" checked={drivingLicense} onChange={e => setDrivingLicense(e.target.checked)} />
                      {t('I have an Israel Driving License')}
                    </Label>
                  </div>
                </>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>{t('Back')}</Button>
                <Button onClick={role === 'resident' ? handleSubmit : handleNext} disabled={loading || !phone || !name}>
                  {role === 'resident' ? t('Complete') : t('Next')}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && role === 'caregiver' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('Work Request Type')}</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={workRequest} 
                  onChange={e => setWorkRequest(e.target.value as any)}
                >
                  <option value="Permanent">{t('Permanent')}</option>
                  <option value="Reliever">{t('Reliever')}</option>
                  <option value="Register reliever">{t('Register reliever')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('Work Area License')}</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={workArea} 
                  onChange={e => setWorkArea(e.target.value as any)}
                >
                  <option value="Area 1">{t('Area 1')}</option>
                  <option value="Area 2">{t('Area 2')}</option>
                  <option value="Area 3">{t('Area 3')}</option>
                  <option value="All Area">{t('All Area')}</option>
                </select>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>{t('Back')}</Button>
                <Button onClick={handleSubmit} disabled={loading}>{t('Complete Profile')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
