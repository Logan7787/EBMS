import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { BattaStatus } from '../../types'

interface StatusBadgeProps {
  status: BattaStatus | 'active' | 'inactive'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()

  const styles = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-700 border-slate-200"
  }

  const labels = {
    pending: t('status.pending'),
    approved: t('status.approved'),
    rejected: t('status.rejected'),
    active: t('employee.active'),
    inactive: t('employee.inactive')
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      styles[status] || styles.inactive,
      className
    )}>
      {labels[status] || status}
    </span>
  )
}
