import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { useMyBattaEntries } from '../../hooks/useBatta'
import { BattaStatus } from '../../types'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'

export default function EmployeeInbox() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<BattaStatus | 'all'>('all')
  const { data: entries, isLoading } = useMyBattaEntries(filter === 'all' ? undefined : filter)

  const tabs: { label: string; value: BattaStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: t('status.pending'), value: 'pending' },
    { label: t('status.approved'), value: 'approved' },
    { label: t('status.rejected'), value: 'rejected' }
  ]

  const columns = [
    { header: t('batta.date'), accessor: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-slate-800">{formatDate(item.date)}</span>
        <span className="text-[10px] uppercase font-bold text-slate-400">{item.day_night} Shift</span>
      </div>
    ) },
    { header: t('batta.particulars'), accessor: 'particulars' as const },
    { header: "Status", accessor: (item: any) => (
      <div className="flex flex-col gap-1 items-start">
        <StatusBadge status={item.status} />
        {item.status === 'rejected' && item.reject_reason && (
          <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium italic mt-1 leading-snug max-w-[150px]">
            Reason: {item.reject_reason}
          </span>
        )}
      </div>
    ) },
    { header: 'Amount', accessor: (item: any) => {
      const emp = Array.isArray(item.employee) ? item.employee[0] : item.employee;
      const defaultAmount = emp?.batta_amount || 0;
      if (item.status === 'approved' && item.approved_amount !== undefined && item.approved_amount !== null) {
        if (item.approved_amount < defaultAmount) {
          return (
             <div className="flex flex-col">
               <span className="text-amber-600 font-bold">₹{item.approved_amount}</span>
               <span className="text-[10px] line-through text-slate-400">₹{defaultAmount}</span>
             </div>
          )
        }
        return <span className="text-emerald-600 font-bold">₹{item.approved_amount}</span>
      }
      return <span className="text-slate-600 font-bold max-w-[100px]">₹{defaultAmount} (Standard)</span>
    } }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('nav.inbox')} 
        subtitle="Track the status of your submitted field allowance requests."
      />

      <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              filter === tab.value 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable 
        columns={columns} 
        data={entries} 
        loading={isLoading}
      />
    </div>
  )
}
