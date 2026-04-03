import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { useMyBattaEntries, useDeleteBatta } from '../../hooks/useBatta'
import { BattaStatus } from '../../types'
import { formatDate, getMonthOptions, getYearOptions, cn } from '../../lib/utils'
import { Search, Edit2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function EmployeeInbox() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const deleteBatta = useDeleteBatta()
  const [filter, setFilter] = useState<BattaStatus | 'all'>('all')
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    period: '',
    search: ''
  })
  
  const { data: entries, isLoading } = useMyBattaEntries(
    filter === 'all' ? undefined : filter,
    {
      month: Number(filters.month),
      year: Number(filters.year),
      period: filters.period || undefined,
      search: filters.search
    }
  )

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Are you sure you want to delete your entry for ${formatDate(date)}?`)) return
    
    try {
      await deleteBatta.mutateAsync(id)
      toast.success("Entry deleted successfully")
    } catch (error) {
      toast.error("Failed to delete entry")
    }
  }

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
    } },
    { header: t('actions.actions'), accessor: (item: any) => (
      <div className="flex items-center gap-2">
        {item.status === 'pending' && (
          <>
            <button 
              onClick={() => navigate(`/submit-batta?id=${item.id}`)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Edit Entry"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => handleDelete(item.id, item.date)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete Entry"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    ) }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('nav.inbox')} 
        subtitle="Track the status of your submitted field allowance requests."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 md:flex-initial">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search particulars..." 
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div className="w-32">
            <select 
              value={filters.month} 
              onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {getMonthOptions().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="w-32">
            <select 
              value={filters.year} 
              onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {getYearOptions().map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>

          <div className="w-40">
            <select 
              value={filters.period} 
              onChange={e => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Full Month</option>
              <option value="1">1st - 15th</option>
              <option value="2">16th - End</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={entries} 
        loading={isLoading}
      />
    </div>
  )
}
