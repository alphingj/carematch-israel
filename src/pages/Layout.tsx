import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { loginWithGoogle, logout } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { UserTour } from '../components/UserTour';
import { NotificationPrompt } from '../components/NotificationPrompt';
import { InstallPrompt } from '../components/InstallPrompt';
import { useJobAlerts } from '../hooks/useJobAlerts';
import { HeartHandshake, LogOut, User as UserIcon, ShieldCheck, Globe, Home, Briefcase, PlusCircle, Github, Linkedin, Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function Layout() {
  useJobAlerts();
  const install = useInstallPrompt();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
  }, []);
  const { user, profile, loading } = useAuth();
  const { t, language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();

  const [showLangModal, setShowLangModal] = useState(false);
  const [targetLang, setTargetLang] = useState<'en' | 'he'>('en');

  const handleLangClick = (lang: 'en' | 'he') => {
    if (lang !== language) {
      setTargetLang(lang);
      setShowLangModal(true);
    }
  };

  const confirmLangChange = () => {
    setLanguage(targetLang);
    setShowLangModal(false);
  };

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isEmailAdmin = user?.email === 'alphingj@gmail.com' || user?.email === 'alphingrowthchannel@gmail.com';
  const isAdmin = profile?.role === 'admin' || isEmailAdmin;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir={dir}>
      <UserTour />
      <NotificationPrompt />
      <InstallPrompt />
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-blue-600 shrink-0">
            <HeartHandshake className="h-8 w-8" />
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">CareMatch Israel</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center bg-slate-200 rounded-md p-1 mr-1 sm:mr-2 shrink-0">
              <button 
                onClick={() => handleLangClick('en')}
                className={`px-2 py-1 text-xs font-medium rounded ${language === 'en' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                EN
              </button>
              <button 
                onClick={() => handleLangClick('he')}
                className={`px-2 py-1 text-xs font-medium rounded ${language === 'he' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                HE
              </button>
            </div>

            {loading ? (
              <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-md shrink-0"></div>
            ) : user ? (
              <>
                <Link id="nav-dashboard" to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shrink-0">
                  <Home className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">{t('Dashboard')}</span>
                </Link>
                <Link id="nav-jobs" to="/jobs" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shrink-0">
                  <Briefcase className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">{t('Job Board')}</span>
                </Link>
                {(profile?.onboardingCompleted || isEmailAdmin) && (
                  <Button id="nav-post-job" onClick={() => navigate('/jobs/create')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 sm:px-4 h-9 flex items-center gap-1.5 shrink-0">
                    <PlusCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('Post Job')}</span>
                  </Button>
                )}
                {(profile?.onboardingCompleted || isEmailAdmin) && (
                  <Link id="nav-profile" to="/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 sm:ml-2 shrink-0">
                    <UserIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden md:inline">{t('Profile')}</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link id="nav-admin" to="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden md:inline">{t('Admin')}</span>
                  </Link>
                )}
              </>
            ) : (
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 shrink-0">{t('nav.login')}</Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t py-8 text-center text-sm">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            {install.deferred && !isInstalled && (
              <button
                onClick={install.prompt}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
            <a
              href="https://github.com/alphingj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 transition-colors p-2"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com/in/alphingj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-600 transition-colors p-2"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
          <p className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent font-bold text-lg tracking-wide hover:scale-105 transition-transform inline-block">
            Made by Alphin GJ
          </p>
        </div>
      </footer>

      <ConfirmModal 
        isOpen={showLangModal}
        title={t(`lang.confirm.${targetLang}.title`)}
        message={t(`lang.confirm.${targetLang}.message`)}
        confirmText={t(`lang.confirm.${targetLang}.continue`)}
        cancelText={t(`lang.confirm.${targetLang}.cancel`)}
        onConfirm={confirmLangChange}
        onCancel={() => setShowLangModal(false)}
      />
    </div>
  );
}
