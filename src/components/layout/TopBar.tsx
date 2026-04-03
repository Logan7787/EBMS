import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { Bell, Search, Globe } from 'lucide-react'
import i18n from '../../i18n'

export function TopBar() {
  useTranslation()
  const user = useAuthStore(s => s.user)

  const toggleLanguage = () => {
    const langs = ['en', 'ta', 'hi']
    const currentIndex = langs.indexOf(i18n.language)
    const nextIndex = (currentIndex + 1) % langs.length
    i18n.changeLanguage(langs[nextIndex])
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative hidden md:block w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleLanguage}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 px-3"
          title="Switch Language"
        >
          <Globe size={20} />
          <span className="text-xs font-semibold uppercase">{i18n.language}</span>
        </button>
        
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-slate-500">{user?.role} • {user?.site}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {user?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  )
}
