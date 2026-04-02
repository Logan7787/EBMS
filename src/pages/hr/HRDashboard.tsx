import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StatCard } from '../../components/shared/StatCard'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { PageHeader } from '../../components/shared/PageHeader'
import { SummaryChart } from '../../components/shared/SummaryChart'
import { useEmployees } from '../../hooks/useEmployees'
import { useBattaStats, usePendingTeamBatta, useMyBattaEntries } from '../../hooks/useBatta'
import { Users, UserCheck, Clock, Calendar, ArrowRight, Send, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { formatDate } from '../../lib/utils'
import { MissingBattaAlert } from '../../components/shared/MissingBattaAlert'

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

export default function HRDashboard() {
  const { t } = useTranslation()
  const { data: employees } = useEmployees()
  const { data: pendingEntries, isLoading: pendingLoading } = usePendingTeamBatta()
  const { data: allRecent } = useMyBattaEntries()
  const { data: personalStats, isLoading: statsLoading } = useBattaStats()

  useEffect(() => {
    if (!statsLoading && personalStats && personalStats.pending > 0) {
      const shown = sessionStorage.getItem('pending_notification_shown')
      if (!shown) {
        toast.warning("Personal Batta Pending", {
          description: "One or more of your personal batta submissions are still pending approval.",
          duration: 8000,
          action: {
            label: "View My Inbox",
            onClick: () => window.location.hash = "/inbox"
          },
        })
        sessionStorage.setItem('pending_notification_shown', 'true')
      }
    }
  }, [personalStats, statsLoading])

  const stats = [
    {
      title: t('hr.totalEmployees'),
      value: employees?.length || 0,
      icon: <Users size={20} />,
      color: 'indigo' as const
    },
    {
      title: t('hr.activeEmployees'),
      value: employees?.filter(e => e.active).length || 0,
      icon: <UserCheck size={20} />,
      color: 'emerald' as const
    },
    {
      title: t('hr.pendingApprovals'),
      value: pendingEntries?.length || 0,
      icon: <Clock size={20} />,
      color: 'amber' as const
    },
    {
      title: t('hr.thisMonthEntries'),
      value: allRecent?.filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === new Date().getMonth()
      }).length || 0,
      icon: <Calendar size={20} />,
      color: 'purple' as const
    }
  ]

  const siteData = employees?.reduce((acc: any[], emp) => {
    const existing = acc.find(a => a.label === emp.site)
    if (existing) existing.value += 1
    else acc.push({ label: emp.site || 'Other', value: 1 })
    return acc
  }, []).sort((a, b) => b.value - a.value).slice(0, 5) || []

  const columns = [
    { header: t('employee.name'), sortable: true, sortKey: 'name', accessor: (item: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
          {item.employee?.name.charAt(0)}
        </div>
        <div>
          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.employee?.name || 'Employee'}</div>
          <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{item.employee?.emp_code}</div>
        </div>
      </div>
    )},
    { header: t('batta.date'), sortable: true, sortKey: 'date', accessor: (item: any) => (
       <span className="font-mono text-xs font-bold text-slate-500">{formatDate(item.date)}</span>
    )},
    { header: t('employee.site'), sortable: true, sortKey: 'site', accessor: (item: any) => (
      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{item.employee?.site}</span>
    )},
    { header: t('batta.amount'), sortable: true, sortKey: 'amount', accessor: (item: any) => (
      <span className="text-slate-900 font-black">₹{item.employee?.batta_amount || 0}</span>
    )},
    { header: "Status", accessor: (item: any) => <StatusBadge status={item.status} /> }
  ]

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader 
        title={t('nav.dashboard')} 
        subtitle="Welcome back to the E-Batta HR control panel."
      />

      <MissingBattaAlert entries={allRecent} />

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-900/5 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ArrowRight size={100} />
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight uppercase">My Inbox</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">Track the status of your personally submitted field allowance requests.</p>
              </div>
              <Link 
                to="/inbox"
                className="inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all"
              >
                Explore Inbox
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-200 flex flex-col justify-between text-white hover:scale-[1.02] transition-transform duration-500 group overflow-hidden relative">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <div className="relative">
                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Send size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight uppercase">{t('nav.submitMyBatta')}</h3>
                <p className="text-indigo-100 text-sm mb-8 leading-relaxed opacity-80 font-medium">Instantly submit your field work particulars for rapid approval.</p>
              </div>
              <Link 
                to="/submit-batta"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-2xl shadow-indigo-900/40 relative z-10"
              >
                Launch Request
                <Send size={16} />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <div className="h-0.5 w-6 bg-indigo-600" />
              {t('batta.recentEntries')}
            </h3>
            <DataTable 
              columns={columns} 
              data={pendingEntries} 
              loading={pendingLoading}
            />
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-8">
           <SummaryChart 
            title="Workforce Distribution" 
            data={siteData} 
          />
          
          <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
               <Calendar size={120} />
            </div>
            <div className="relative">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Quick Tip</h4>
              <p className="text-sm font-medium leading-relaxed mb-6 italic opacity-80">"Efficiency is about doing things right; effectiveness is about doing the right things."</p>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Live System Ready
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
