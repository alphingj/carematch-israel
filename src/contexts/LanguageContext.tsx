import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'he';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    'nav.jobs': 'Job Board',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    'nav.login': 'Login / Sign Up',
    'home.title': 'Connecting Caregivers & Families in Israel',
    'home.subtitle': 'Find reliable relievers or post job opportunities easily. The best place to hire caretakers in Israel.',
    'home.join': 'Join the Community',
    'home.browse': 'Browse Jobs',
    'home.post': 'Post a Job',
    'home.how': 'How CareMatch Israel Works',
    'home.how_sub': 'A simpler way to find care and caregiving opportunities.',
    'home.for_caregivers': 'For Caregivers',
    'home.for_families': 'For Families & Residents',
    'home.find_jobs': 'Find Reliever Jobs',
    'home.find_jobs_desc': 'Browse open positions across Israel tailored to your skills and preferred areas.',
    'home.manage_avail': 'Manage Availability',
    'home.manage_avail_desc': 'Easily toggle your status when you are occupied or looking for new opportunities.',
    'home.direct_contact': 'Direct Contact',
    'home.direct_contact_desc': 'Connect directly with families via WhatsApp without any middlemen.',
    'home.post_jobs': 'Post Jobs Easily',
    'home.post_jobs_desc': 'Create job listings in seconds with our simple and structured form.',
    'home.reach_caregivers': 'Reach Qualified Caregivers',
    'home.reach_caregivers_desc': 'Your job posting is instantly visible to a network of registered caretakers.',
    'home.manage_listings': 'Manage Listings',
    'home.manage_listings_desc': 'Activate or deactivate your job postings once you\'ve found the right person.',
    'home.stats.caregivers': 'Registered Caregivers',
    'home.stats.jobs': 'Open Jobs',
    'home.stats.working': 'Currently Working',
    'lang.confirm.he.title': 'Change Language',
    'lang.confirm.he.message': 'Are you sure you want to change output to Hebrew?',
    'lang.confirm.he.cancel': 'Cancel',
    'lang.confirm.he.continue': 'המשך',
    'lang.confirm.en.title': 'שינוי שפה',
    'lang.confirm.en.message': 'האם אתה בטוח שברצונך לשנות את השפה לאנגלית?',
    'lang.confirm.en.cancel': 'ביטול',
    'lang.confirm.en.continue': 'Continue',
    'tour.resident.step1': 'Welcome to CareMatch! Let us show you around.',
    'tour.resident.step2': 'Click here to post a new job opportunity for caregivers.',
    'tour.resident.step3': 'Browse jobs you and others have posted here.',
    'tour.resident.step4': 'Manage your personal details and active job postings here.',
    'tour.caregiver.step1': 'Welcome to CareMatch! Let us help you find your next caregiving opportunity.',
    'tour.caregiver.step2': 'This is the Job Board. You can find all available jobs here.',
    'tour.caregiver.step3': 'Manage your availability, languages, and profile details here.',
    'tour.last': 'Finish',
    'tour.skip': 'Skip',
    'tour.next': 'Next',
    'tour.back': 'Back',
  },
  he: {
    'nav.jobs': 'לוח דרושים',
    'nav.profile': 'פרופיל',
    'nav.admin': 'ניהול',
    'nav.logout': 'התנתק',
    'nav.login': 'התחבר / הרשם',
    'home.title': 'מחברים בין מטפלים ומשפחות בישראל',
    'home.subtitle': 'מצא מחליפים אמינים או פרסם משרות בקלות. המקום הטוב ביותר לשכור מטפלים בישראל.',
    'home.join': 'הצטרף לקהילה',
    'home.browse': 'חפש משרות',
    'home.post': 'פרסם משרה',
    'home.how': 'איך CareMatch ישראל עובד',
    'home.how_sub': 'דרך פשוטה יותר למצוא טיפול והזדמנויות עבודה.',
    'home.for_caregivers': 'למטפלים',
    'home.for_families': 'למשפחות ומטופלים',
    'home.find_jobs': 'חפש משרות החלפה',
    'home.find_jobs_desc': 'עיין במשרות פתוחות ברחבי הארץ המותאמות לכישורים ולאזורים המועדפים עליך.',
    'home.manage_avail': 'נהל זמינות',
    'home.manage_avail_desc': 'שנה בקלות את הסטטוס שלך כאשר אתה תפוס או מחפש הזדמנויות חדשות.',
    'home.direct_contact': 'קשר ישיר',
    'home.direct_contact_desc': 'צור קשר ישירות עם משפחות דרך WhatsApp ללא מתווכים.',
    'home.post_jobs': 'פרסם משרות בקלות',
    'home.post_jobs_desc': 'צור מודעות דרושים בשניות עם הטופס הפשוט והמובנה שלנו.',
    'home.reach_caregivers': 'הגע למטפלים מוסמכים',
    'home.reach_caregivers_desc': 'מודעת הדרושים שלך גלויה באופן מיידי לרשת של מטפלים רשומים.',
    'home.manage_listings': 'נהל מודעות',
    'home.manage_listings_desc': 'הפעל או השבת את מודעות הדרושים שלך לאחר שמצאת את האדם הנכון.',
    'home.stats.caregivers': 'מטפלים רשומים',
    'home.stats.jobs': 'משרות פתוחות',
    'home.stats.working': 'עובדים כעת',
    'lang.confirm.he.title': 'Change Language',
    'lang.confirm.he.message': 'Are you sure you want to change output to Hebrew?',
    'lang.confirm.he.cancel': 'Cancel',
    'lang.confirm.he.continue': 'המשך',
    'lang.confirm.en.title': 'שינוי שפה',
    'lang.confirm.en.message': 'האם אתה בטוח שברצונך לשנות את השפה לאנגלית?',
    'lang.confirm.en.cancel': 'ביטול',
    'lang.confirm.en.continue': 'Continue',
    'Visa Status': 'סטטוס ויזה',
    'Food Money': 'דמי כלכלה',
    'Romanian': 'רומנית',
    'Independent': 'עצמאי',
    'Walking Stick': 'מקל הליכה',
    'Helihon': 'הליכון',
    'Wheel Chair': 'כיסא גלגלים',
    'Manof': 'מנוף',
    'Bedridden': 'מרותק למיטה',
    'With': 'עם',
    'Without': 'בלי',
    'With/Without': 'עם/בלי',
    'Yes': 'כן',
    'No': 'לא',
    'Area 1': 'אזור 1',
    'Area 2': 'אזור 2',
    'Area 3': 'אזור 3',
    'All Area': 'כל האזורים',
    'Male': 'זכר',
    'Female': 'נקבה',
    'Lives Alone': 'חי לבד',
    'Lives with Family member': 'חי עם בן משפחה',
    'Lives with Spouse': 'חי עם בן/בת זוג',
    'Others (specify)': 'אחר (פרט)',
    'Cat': 'חתול',
    'Dog': 'כלב',
    'Both': 'שניהם',
    'Others': 'אחר',
    'Clear mind': 'צלול',
    'Not clear': 'לא צלול',
    'Partial': 'חלקי',
    'ACTIVE': 'פעיל',
    'INACTIVE': 'לא פעיל',
    'Active': 'פעיל',
    'Closed': 'סגור',
    'None': 'אף אחד',
    'tour.resident.step1': 'ברוכים הבאים ל-CareMatch! בואו נערוך לכם סיור קצר.',
    'tour.resident.step2': 'לחצו כאן כדי לפרסם הצעת עבודה חדשה למטפלים.',
    'tour.resident.step3': 'כאן תוכלו לעיין במשרות שאתם ואחרים פרסמתם.',
    'tour.resident.step4': 'נהלו כאן את הפרטים האישיים שלכם ואת מודעות הדרושים הפעילות שלכם.',
    'tour.caregiver.step1': 'ברוכים הבאים ל-CareMatch! בואו נעזור לכם למצוא את המשרה הבאה שלכם.',
    'tour.caregiver.step2': 'זהו לוח הדרושים. כאן תוכלו למצוא את כל המשרות הזמינות.',
    'tour.caregiver.step3': 'נהלו כאן את הזמינות שלכם, שפות שאתם דוברי, ופרטי הפרופיל שלכם.',
    'tour.last': 'סיום',
    'tour.skip': 'דלג',
    'tour.next': 'הבא',
    'tour.back': 'קודם',
    'Urgent': 'דחוף',
    'Caregiver': 'מטפל/ת',
    'Patient Details': 'פרטי מטופל',
    'Gender & Age': 'מין וגיל',
    'Job Requirements': 'דרישות התפקיד',
    'Languages': 'שפות',
    'Living at home': 'מגורים בבית',
    'Pets': 'חיות מחמד',
    'Contact Information': 'פרטי קשר',
    'Contact': 'איש קשר',
    'Call': 'התקשר',
    'WhatsApp': 'וואטסאפ',
    'Job Not Found': 'משרה לא נמצאה',
    'This job posting may have been removed or you might have an invalid link.': 'ייתכן שמודעת דרושים זו הוסרה או שהקישור שגוי.',
    'Back to Job Board': 'חזרה ללוח משרות',
    'Link copied to clipboard!': 'הקישור הועתק!',
    'Back to Jobs': 'חזרה למשרות',
    'Share Job': 'שתף משרה',
    'Deactivate Listing': 'הקפא מודעה',
    'Activate Listing': 'הפעל מודעה',
    'Deactivate Job Posting': 'הקפאת מודעת משרה',
    'Are you sure you want to deactivate this job posting? It will no longer be visible on the job board.': 'האם אתה בטוח שברצונך להקפיא מודעה זו? היא לא תופיע יותר בלוח המשרות.',
    'Yes, Deactivate': 'כן, הקפא',
    'Upcoming start date': 'תאריך התחלה קרוב',
    'Permanent': 'קבוע',
    'Reliever': 'מחליף/ה',
    'Register reliever': 'רישום למחליף/ה',
    'Other': 'אחר',
    'Hebrew': 'עברית',
    'English': 'אנגלית',
    'Russian': 'רוסית',
    'All Areas': 'כל האזורים',
    'Place / City Name': 'שם מקום / עיר',
    '(optional)': '(אופציונלי)',
    'e.g. Tel Aviv, Haifa, ...': 'לדוגמה: תל אביב, חיפה, ...',
    'No jobs found': 'לא נמצאו משרות',
    'We couldn\'t find any active jobs matching your current filters. Try adjusting your search criteria.': 'לא מצאנו משרות פעילות המתאימות לסינונים הנוכחיים שלך. נסה לשנות את קריטריוני החיפוש.',
    'Clear Filters': 'נקה סינונים',
    'Loading jobs...': 'טוען משרות...',
    'Filter by Area': 'סנן לפי אזור',
    'Filter by Job Type': 'סנן לפי סוג משרה',
    'Browse and filter available caregiver positions': 'עיין ומיין משרות למטפלים',
    'e.g. 24/7, Reliever': 'לדוגמה: 24/7, מחליף',
    'Post a Job': 'פרסם משרה',
    'Post Job': 'פרסם משרה',
    'Basic Information': 'מידע בסיסי',
    'Job Title': 'שם משרה',
    'Mark as Urgent': 'סמן כדחוף',
    'This will highlight your job posting to attract immediate attention.': 'יבליט את המשרה כדי למשוך יותר תשומת לב.',
    'Start Date': 'תאריך התחלה',
    'End Date': 'תאריך סיום',
    'Job Type': 'סוג משרה',
    'Area': 'אזור',
    'Patient Age': 'גיל המטופל',
    'Patient Gender': 'מין המטופל',
    'Languages Needed': 'שפות נדרשות',
    'Living Arrangement': 'מצב מגורים',
    'Mental State': 'מצב קוגניטיבי',
    'Movement': 'ניידות',
    'Care Needs / Diagnosis': 'צרכים טיפוליים / אבחון',
    'Contact Name & Relation': 'שם איש קשר וקרבה',
    'Contact Phone': 'טלפון ליצירת קשר',
    'Contact Method': 'אמצעי התקשרות',
    'Whatsapp Only': 'וואטסאפ בלבד',
    'Call only': 'שיחות טלפון בלבד',
    'Specify living arrangement...': 'פרט הסדר מגורים...',
    'Specify pets...': 'פרט חיות מחמד...',
    'e.g. Female': 'לדוגמה: נקבה',
    'e.g. Looking for caregiver Female Reliever': 'לדוגמה: מחפש/ת מטפלת מחליפה',
    'e.g. 24/7, Weekend': 'לדוגמה: 24/7, סוף שבוע',
    'e.g. Sarah (Daughter)': 'לדוגמה: שרה (בת)',
    'e.g. Dementia, needs help with bathing': 'לדוגמה: דמנציה, זקוקה לעזרה ברחצה',
    'Cancel': 'ביטול',
    'Posting...': 'מפרסם...',
    'My Profile': 'הפרופיל שלי',
    'Manage your personal information and job postings.': 'נהל את המידע האישי שלך ואת מודעות הדרושים.',
    'Personal Info': 'מידע אישי',
    'Edit': 'עריכה',
    'Full Name': 'שם מלא',
    'Phone Number': 'מספר טלפון',
    'Phone': 'טלפון',
    'Work Area': 'אזור עבודה',
    'Work Request': 'סוג החלפה מבוקש',
    'Save Changes': 'שמור שינויים',
    'Log Out': 'התנתק',
    'My Job Postings': 'המשרות שלי',
    'Post New Job': 'פרסם משרה חדשה',
    'Loading your jobs...': 'טוען משרות שלך...',
    'No jobs posted yet': 'עדיין לא פורסמו משרות',
    'You haven\'t created any job postings. When you do, they will appear here.': 'טרם יצרת משרות. כשתייצר הן יופיעו כאן.',
    'Create Your First Job': 'צור משרה ראשונה',
    'Deactivate': 'הקפא',
    'Reactivate': 'הפעל',
    'Complete Your Profile': 'השלם את הפרופיל שלך',
    'I am registering as a:': 'אני נרשם כ:',
    'Israel Resident': 'תושב/ת ישראל',
    'Next': 'הבא',
    'Israel Phone Number': 'מספר טלפון (ישראל)',
    'Gender': 'מין',
    'Nationality': 'לאום',
    'Languages Spoken': 'שפות דבורות',
    'I have an Israel Driving License': 'יש לי רישיון נהיגה ישראלי',
    'Back': 'חזור',
    'Complete': 'סיים',
    'Work Request Type': 'סוג החלפה מבוקש',
    'Work Area License': 'אזור עבודה ברישיון',
    'Complete Profile': 'סיים פרופיל',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'he')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === 'he' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
