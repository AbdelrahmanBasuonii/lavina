import { t } from '../i18n.js';

const formatDate = (value, language) => value
  ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
  : t('غير مضاف', language);

export default function AccountDetails({ user, language }) {
  const details = [
    ['الاسم الكامل', [t(user.title, language), user.first_name, user.last_name].filter(Boolean).join(' ')],
    ['البريد الإلكتروني', user.email],
    ['رقم الهاتف', user.phone],
    ['تاريخ الميلاد', formatDate(user.birth_date, language)],
    ['تاريخ عيد الزواج', formatDate(user.wedding_date, language)],
    ['النشرة الإخبارية', t(user.newsletter ? 'مشترك' : 'غير مشترك', language)],
  ];

  return (
    <dl className="account-details">
      {details.map(([label, value]) => (
        <div key={label}>
          <dt>{t(label, language)}</dt>
          <dd dir={label === 'البريد الإلكتروني' || label === 'رقم الهاتف' ? 'ltr' : undefined}>{value || t('غير مضاف', language)}</dd>
        </div>
      ))}
    </dl>
  );
}
