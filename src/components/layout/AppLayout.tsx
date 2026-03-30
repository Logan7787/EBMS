import { ReactNode, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('public:batta_entries')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'batta_entries' },
        (payload) => {
          if (payload.new.manager_id === user.id) {
            toast('New Batta Request', {
              description: 'You have received a new approval request!',
              icon: '📩',
            })
            queryClient.invalidateQueries({ queryKey: ['pending-batta'] })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'batta_entries' },
        (payload) => {
          if (payload.new.emp_id === user.id && payload.old.status === 'pending' && payload.new.status !== 'pending') {
            const isApproved = payload.new.status === 'approved'
            toast(isApproved ? 'Batta Approved' : 'Batta Rejected', {
              description: `Your allowance request was ${payload.new.status}.`,
              icon: isApproved ? '✅' : '❌',
            })
            queryClient.invalidateQueries({ queryKey: ['batta-entries'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar - fixed width on desktop */}
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300 print:ml-0">
        <div className="print:hidden">
          <TopBar />
        </div>
        
        <main className="p-6 md:p-8 flex-1 max-w-[1600px] w-full mx-auto print:p-0 print:max-w-none">
          {children}
        </main>
        
        <footer className="px-8 py-4 text-center text-slate-400 text-xs border-t border-slate-100 print:hidden">
          &copy; {new Date().getFullYear()} E-Batta Management System. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
