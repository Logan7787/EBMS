import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Send, BarChart3, UserCircle, Inbox } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { usePendingTeamBatta } from '../../hooks/useBatta'
import { cn } from '../../lib/utils'

export function MobileNavbar() {
  const user = useAuthStore(s => s.user)
  const { data: pendingBatta } = usePendingTeamBatta()
  const pendingCount = pendingBatta?.length || 0

  const navItems = [
    { 
      label: 'Home', 
      path: (user?.role === 'HR') ? '/hr' 
            : (user?.role === 'accounts' || user?.role === 'supercheck') ? '/hr/reports'
            : (user?.role === 'Manager') ? '/manager' 
            : '/employee', 
      icon: LayoutDashboard,
      roles: ['HR', 'Manager', 'Employee', 'accounts', 'supercheck']
    },
    { 
      label: 'Submit', 
      path: '/submit-batta', 
      icon: Send,
      roles: (user?.battaAmount || 0) > 0 ? ['Employee', 'Manager', 'HR'] : []
    },
    { 
      label: 'Inbox', 
      path: (user?.role === 'Manager' || user?.role === 'HR') ? '/manager/inbox' : '/inbox', 
      icon: Inbox, 
      roles: ['HR', 'Manager', 'Employee']
    },
    { 
      label: 'History', 
      path: '/employee/report', 
      icon: BarChart3, 
      roles: ['Employee', 'Manager', 'HR']
    },
    { 
      label: 'Profile', 
      path: '/profile', 
      icon: UserCircle, 
      roles: ['HR', 'Manager', 'Employee', 'accounts', 'supercheck']
    },
  ]

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role || ''))

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-effect z-50 lg:hidden safe-area-bottom tap-highlight-none">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {filteredItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all relative",
              isActive ? "text-indigo-600" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                   "p-1.5 rounded-xl transition-all",
                   "group-active:scale-90"
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                {item.path === '/manager/inbox' && pendingCount > 0 && (
                  <span className="absolute -top-1 right-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
