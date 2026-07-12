import React, { useEffect, useState } from 'react';
import { Joyride, Step, EventData, STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function UserTour() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    // Only run if user is logged in, has completed onboarding, and hasn't seen the tour
    if (user && profile && profile.onboardingCompleted) {
      const tourKey = `tour_completed_${user.uid}`;
      const hasSeenTour = localStorage.getItem(tourKey);

      if (!hasSeenTour) {
        // Define steps based on role
        if (profile.role === 'resident') {
          setSteps([
            {
              target: 'body',
              content: t('tour.resident.step1'),
              placement: 'center',
              skipBeacon: true,
            },
            {
              target: '#nav-post-job',
              content: t('tour.resident.step2'),
              placement: 'bottom',
            },
            {
              target: '#nav-jobs',
              content: t('tour.resident.step3'),
              placement: 'bottom',
            },
            {
              target: '#nav-profile',
              content: t('tour.resident.step4'),
              placement: 'bottom',
            }
          ]);
        } else if (profile.role === 'caregiver') {
          setSteps([
            {
              target: 'body',
              content: t('tour.caregiver.step1'),
              placement: 'center',
              skipBeacon: true,
            },
            {
              target: '#nav-jobs',
              content: t('tour.caregiver.step2'),
              placement: 'bottom',
            },
            {
              target: '#nav-profile',
              content: t('tour.caregiver.step3'),
              placement: 'bottom',
            }
          ]);
        }
        
        // Slight delay to ensure UI is fully rendered
        const timer = setTimeout(() => {
          setRun(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, profile, t]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (user) {
        localStorage.setItem(`tour_completed_${user.uid}`, 'true');
      }
      setRun(false);
    }
  };

  const isRTL = language === 'he';

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleJoyrideCallback}
      options={{
        primaryColor: '#2563eb', // blue-600
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'primary', 'skip']
      }}
      styles={{
        tooltipContainer: {
          textAlign: isRTL ? 'right' : 'left',
          direction: isRTL ? 'rtl' : 'ltr',
        },
        buttonPrimary: {
          direction: 'ltr',
        },
        buttonBack: {
          direction: 'ltr',
        }
      }}
      locale={{
        last: t('tour.last'),
        skip: t('tour.skip'),
        next: t('tour.next'),
        back: t('tour.back'),
      }}
    />
  );
}
