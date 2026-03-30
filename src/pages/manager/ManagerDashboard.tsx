import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StatCard } from '../../components/shared/StatCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { SummaryChart } from '../../components/shared/SummaryChart'
import { usePendingTeamBatta, useBattaStats } from '../../hooks/useBatta'
import { useEmployees } from '../../hooks/useEmployees'
import { useAuthStore } from '../../stores/authStore'
import { Clock, Users, CheckCircle, ArrowRight, Send, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export default function ManagerDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const { data: pendingEntries } = usePendingTeamBatta()
  const { data: employees } = useEmployees()
  const { data: myStats, isLoading: statsLoading } = useBattaStats()

  useEffect(() => {
    if (!statsLoading && myStats && myStats.pending > 0) {
      const shown = sessionStorage.getItem('pending_notification_shown')
      if (!shown) {
        toast.warning("Personal Batta Pending", {
          description: "Your own batta submissions are still pending. Contact HR for approval.",
          duration: 8000,
          action: {
            label: "Open Inbox",
            onClick: () => window.location.hash = "/inbox"
          },
        })
        sessionStorage.setItem('pending_notification_shown', 'true')
      }
    }
  }, [myStats, statsLoading])

  const stats = [
    {
      title: t('hr.pendingApprovals'),
      value: pendingEntries?.length || 0,
      icon: <Clock size={20} />,
      color: 'amber' as const
    },
    {
      title: t('manager.teamMembers'),
      value: employees?.filter(e => e.manager_id === user?.id).length || 0,
      icon: <Users size={20} />,
      color: 'blue' as const
    },
    {
      title: t('manager.approvedThisMonth'),
      value: myStats?.thisMonth || 0,
      icon: <CheckCircle size={20} />,
      color: 'emerald' as const
    }
  ]

  const teamDistribution = employees?.reduce((acc: any[], emp) => {
    if (emp.manager_id !== user?.id) return acc
    const existing = acc.find(a => a.label === emp.site)
    if (existing) existing.value += 1
    else acc.push({ label: emp.site || 'Other', value: 1 })
    return acc
  }, []).sort((a, b) => b.value - a.value) || []

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader 
        title={t('nav.dashboard')} 
        subtitle="Manage your team's fieldwork and allowances."
      />

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
        <motion.div variants={item} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-900/5 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <Clock size={120} className="text-slate-900" />
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight uppercase">{t('manager.viewInbox')}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Review and process your team's pending allowance requests instantly.</p>
            </div>
            <Link 
              to="/manager/inbox"
              className="inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all"
            >
              Process Requests
              <ArrowRight size={16} />
            </Link>
          </div>

          {(user?.battaAmount || 0) > 0 && (
            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-200 flex flex-col justify-between text-white hover:scale-[1.02] transition-transform duration-500 group overflow-hidden relative">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <div className="relative">
                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Send size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight uppercase">{t('nav.submitMyBatta')}</h3>
                <p className="text-indigo-100 text-sm mb-8 leading-relaxed opacity-80 font-medium">Submit your own field work particulars for your manager's approval.</p>
              </div>
              <Link 
                to="/submit-batta"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-2xl shadow-indigo-900/40 relative z-10"
              >
                Submit Batta
                <Send size={16} />
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          {teamDistribution.length > 0 && (
            <SummaryChart 
              title="Team Site Distribution" 
              data={teamDistribution} 
            />
          )}

          <div className="bg-emerald-600 p-6 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-500">
               <ShieldCheck size={100} />
            </div>
            <div className="relative">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-100 mb-4 opacity-70">Team Integrity</h4>
              <p className="text-sm font-bold leading-relaxed mb-4">All pending requests are tracked and audited in real-time for compliance.</p>
              <div className="flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Audit Trail Active
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
