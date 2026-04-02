import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { StatCard } from '../../components/shared/StatCard'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { PageHeader } from '../../components/shared/PageHeader'
import { useBattaStats, useMyBattaEntries } from '../../hooks/useBatta'
import { useAuthStore } from '../../stores/authStore'
import { Wallet, Clock, CheckCircle, Calendar } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { MissingBattaAlert } from '../../components/shared/MissingBattaAlert'

export default function EmployeeDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const { data: stats, isLoading: statsLoading } = useBattaStats()
  const { data: recent, isLoading: recentLoading } = useMyBattaEntries()

  useEffect(() => {
    if (!statsLoading && stats && stats.pending > 0) {
      const shown = sessionStorage.getItem('pending_notification_shown')
      if (!shown) {
        toast.warning("Batta Approval Pending", {
          description: "Your batta approval is still pending. Please contact your reporting manager for quick processing.",
          duration: 10000,
          action: {
            label: "Review Inbox",
            onClick: () => window.location.hash = "/inbox" // Simple way to navigate if needed, or just let them click My Inbox
          },
        })
        sessionStorage.setItem('pending_notification_shown', 'true')
      }
    }
  }, [stats, statsLoading])

  const dashboardStats = [
    {
      title: "This Month Batta (₹)",
      value: stats?.thisMonthAmount || 0,
      icon: <Wallet size={20} />,
      color: 'indigo' as const,
      subtitle: `${stats?.thisMonth || 0} days approved`
    },
    {
      title: t('status.pending'),
      value: stats?.pending || 0,
      icon: <Clock size={20} />,
      color: 'amber' as const
    },
    {
      title: t('status.approved'),
      value: stats?.approved || 0,
      icon: <CheckCircle size={20} />,
      color: 'emerald' as const
    }
  ]

  const columns = [
    { header: t('batta.date'), accessor: (item: any) => formatDate(item.date) },
    { header: t('batta.particulars'), accessor: (item: any) => (
      <span className="truncate max-w-xs inline-block" title={item.particulars}>
        {item.particulars}
      </span>
    )},
    { header: t('status.pending'), accessor: (item: any) => <StatusBadge status={item.status} /> }
  ]

  return (
    <div className="space-y-8">
      <PageHeader 
        title={t('nav.dashboard')} 
        subtitle={`Welcome back, ${user?.name}. Here's your shift summary.`}
      />

      <MissingBattaAlert entries={recent} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardStats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" />
            {t('batta.recentEntries')}
          </h3>
        </div>
        <DataTable 
          columns={columns} 
          data={recent?.slice(0, 5)} 
          loading={recentLoading}
        />
      </div>
    </div>
  )
}
