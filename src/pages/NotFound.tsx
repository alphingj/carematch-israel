import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { HeartHandshake } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
        <HeartHandshake className="w-10 h-10" />
      </div>
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">{t('Page Not Found')}</h2>
      <p className="text-slate-600 max-w-md mx-auto mb-8">
        {t('Sorry, we couldn\'t find the page you\'re looking for. It might have been removed or the link might be broken.')}
      </p>
      <div className="flex gap-4">
        <Link to="/">
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">
            {t('Go Home')}
          </Button>
        </Link>
        <Link to="/jobs">
          <Button variant="outline" className="rounded-full px-8">
            {t('View Jobs')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
