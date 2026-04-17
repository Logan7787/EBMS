import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  LayoutDashboard, 
  Send, 
  Inbox, 
  BarChart3, 
  Users, 
  UserCircle, 
  LogOut, 
  IndianRupee,
  Menu,
  X,
  FileText,
  Clock
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useAuth } from '../../hooks/useAuth'
import { usePendingTeamBatta } from '../../hooks/useBatta'
import { cn } from '../../lib/utils'
import { useState } from 'react'

export function Sidebar() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  
  // Only managers will actually fetch this data since the hook checks roles internally
  const { data: pendingBatta } = usePendingTeamBatta()
  const pendingCount = pendingBatta?.length || 0

  const navItems = [
    { 
      label: t('nav.dashboard'), 
      path: (user?.role === 'HR') ? '/hr' 
            : (user?.role === 'accounts' || user?.role === 'supercheck') ? '/hr/reports'
            : (user?.role === 'Manager') ? '/manager' 
            : '/employee', 
      icon: LayoutDashboard,
      roles: ['HR', 'Manager', 'Employee', 'accounts', 'supercheck']
    },
    { 
      label: t('nav.submit'), 
      path: '/submit-batta', 
      icon: Send,
      roles: (user?.battaAmount || 0) > 0 ? ['Employee', 'Manager', 'HR'] : []
    },
    { 
      label: "My Inbox", 
      path: '/inbox', 
      icon: Inbox, 
      roles: (user?.battaAmount || 0) > 0 ? ['Employee', 'Manager', 'HR'] : ['Employee']
    },
    { 
      label: "Team Inbox", 
      path: '/manager/inbox', 
      icon: Inbox, 
      roles: ['Manager', 'HR']
    },
    { 
      label: t('nav.employees'), 
      path: '/hr/employees', 
      icon: Users, 
      roles: ['HR']
    },
    { 
      label: "My Report", 
      path: '/employee/report', 
      icon: FileText, 
      roles: (user?.battaAmount || 0) > 0 ? ['Employee', 'Manager', 'HR'] : ['Employee']
    },
    { 
      label: "Team Report", 
      path: '/manager/team', 
      icon: Users, 
      roles: ['Manager', 'HR']
    },
    { 
      label: "Global Reports", 
      path: '/hr/reports', 
      icon: BarChart3, 
      roles: ['HR', 'accounts', 'supercheck']
    },
    { 
      label: "Global Pending", 
      path: '/hr/pending', 
      icon: Clock, 
      roles: ['HR']
    },
    { 
      label: t('nav.profile'), 
      path: '/profile', 
      icon: UserCircle, 
      roles: ['HR', 'Manager', 'Employee', 'accounts', 'supercheck']
    },
  ]

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role || ''))

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-900 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-[#1E1B4B] text-indigo-200 flex flex-col transition-transform duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <IndianRupee className="text-white" size={24} />
          </div>
          <span className="text-white font-bold text-xl">{t('app.name')}</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                  : "hover:bg-indigo-900/50 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
                <item.icon size={20} />
                <span className="font-medium flex-1">{item.label}</span>
                {item.path === '/manager/inbox' && pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ml-auto">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-900/50">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-900/50 text-[10px] text-indigo-300 uppercase tracking-wider border border-indigo-800">
                {user?.role}
              </span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors text-indigo-400"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
