import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { PageHeader } from '../../components/shared/PageHeader'
import { User, Briefcase, MapPin, IndianRupee, Languages, ShieldCheck, Mail } from 'lucide-react'
import i18n from '../../i18n'


export default function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en'
    i18n.changeLanguage(newLang)
  }

  const details = [
    { icon: User, label: t('employee.name'), value: user?.name },
    { icon: ShieldCheck, label: t('employee.code'), value: user?.empCode },
    { icon: Mail, label: t('auth.email'), value: user?.email || 'N/A' },
    { icon: Briefcase, label: t('employee.designation'), value: user?.designation || 'General Staff' },
    { icon: MapPin, label: t('employee.site'), value: user?.site || 'N/A' },
    { icon: IndianRupee, label: t('employee.rate'), value: `₹${user?.battaAmount} / day` },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title={t('nav.profile')} 
        subtitle="View your account information and preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-black mb-4">
              {user?.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
            <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mt-1">{user?.role}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-50 w-full">
              <button 
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Languages size={20} className="text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Language</span>
                </div>
                <span className="text-xs font-black text-indigo-600 uppercase group-hover:scale-110 transition-transform">
                  {i18n.language === 'en' ? 'English' : 'தமிழ்'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{t('employee.details')}</h3>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {details.map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl hover:bg-slate-50 transition-colors flex items-start gap-4">
                    <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl text-indigo-600">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-slate-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="text-indigo-900 font-bold">Secure Account</h4>
              <p className="text-indigo-700/60 text-sm">Your account is secured with role-based access control. Contact HR to change sensitive information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
