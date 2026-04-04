import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { useEmployees, useManagers } from '../../hooks/useEmployees'
import { useGlobalPendingBatta } from '../../hooks/useBatta'
import { Search, Loader2, Clock, AlertCircle, Copy, Check, UserCheck, Download } from 'lucide-react'
import { cn, getMonthOptions, getYearOptions, formatDate } from '../../lib/utils'
import { toast } from 'sonner'
import ReassignManagerDialog from '../../components/hr/ReassignManagerDialog'
import { getDisplayName } from '../../lib/userUtils'

export default function GlobalPending() {
  const { i18n } = useTranslation()
  const { data: employees } = useEmployees()
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    period: '',
    site: '',
    search: '',
    managerId: ''
  })
  const { data: managers } = useManagers()
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [isReassignOpen, setIsReassignOpen] = useState(false)

  const { data: pendingData, isLoading: pendingLoading } = useGlobalPendingBatta({
    month: Number(filters.month),
    year: Number(filters.year),
    period: filters.period || undefined,
    site: filters.site || undefined,
    search: filters.search || undefined,
    managerId: filters.managerId || undefined
  })

  // Sort data by employee name by default
  const sortedPendingData = useMemo(() => {
    if (!pendingData) return []
    return [...pendingData].sort((a, b) => {
      const nameA = getDisplayName(a.employee, i18n.language) || ''
      const nameB = getDisplayName(b.employee, i18n.language) || ''
      return nameA.localeCompare(nameB)
    })
  }, [pendingData, i18n.language])

  const sites = Array.from(new Set(employees?.map(e => e.site).filter(Boolean)))

  const copyFollowUp = (entry: any) => {
    const managerName = getDisplayName(entry.manager, i18n.language)
    const employeeName = getDisplayName(entry.employee, i18n.language)
    const message = `Hi ${managerName}, approval is pending for ${employeeName}'s batta entry for ${formatDate(entry.date)}. Please check and action.`
    navigator.clipboard.writeText(message)
    toast.success("Follow-up message copied to clipboard!")
  }

  const columns = [
    { 
      header: 'S.No', 
      accessor: (_: any, index: number) => index + 1,
      className: 'w-12 text-center font-bold text-slate-400'
    },
    { 
      header: 'Employee', 
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{getDisplayName(item.employee, i18n.language)}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.employee?.emp_code}</span>
        </div>
      )
    },
    { 
      header: 'Site', 
      accessor: (item: any) => (
        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
          {item.employee?.site}
        </span>
      )
    },
    { 
      header: 'Date & Shift', 
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700">{formatDate(item.date)}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.day_night} Batta</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (item: any) => (
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit",
          item.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
        )}>
          {item.status === 'pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
          {item.status}
        </span>
      )
    },
    { 
      header: 'Assigned Manager', 
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-indigo-600">{getDisplayName(item.manager, i18n.language) || 'N/A'}</span>
          <span className="text-[10px] font-medium text-slate-400 italic">Follow-up required</span>
        </div>
      )
    },
    { 
      header: 'Amount', 
      accessor: (item: any) => {
        const isWork = item.category === 'Work' || !item.category;
        return (
          <span className={cn("font-black", isWork ? "text-slate-900" : "text-slate-400 italic")}>
            ₹{isWork ? (item.employee?.batta_amount || 0) : 0}
          </span>
        )
      }
    },
    {
      header: 'Action',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => copyFollowUp(item)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
            title="Copy follow-up message"
          >
            <Copy size={16} />
            Follow-up
          </button>
          <button 
            onClick={() => { setSelectedEntry(item); setIsReassignOpen(true); }}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border border-amber-100"
            title="Reassign to another manager"
          >
            <UserCheck size={16} />
            Reassign
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Overall Pending Approvals" 
        subtitle="Track and follow up on pending/rejected requests across all managers."
        action={
          <button 
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm print:hidden"
          >
            <Download size={20} />
            Download PDF
          </button>
        }
      />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search employee or manager..." 
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
          
          <div className="w-40">
            <select 
              value={filters.month}
              onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 font-bold"
            >
              {getMonthOptions().map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <select 
              value={filters.year}
              onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 font-bold"
            >
              {getYearOptions().map(y => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <select 
              value={filters.site}
              onChange={e => setFilters(prev => ({ ...prev, site: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 font-bold"
            >
              <option value="">All Sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="w-64">
            <select 
              value={filters.managerId}
              onChange={e => setFilters(prev => ({ ...prev, managerId: e.target.value }))}
              className="w-full px-4 py-2.5 border rounded-xl text-sm bg-slate-50 font-bold text-indigo-600"
            >
              <option value="">All Managers</option>
              {managers?.map(m => (
                <option key={m.id} value={m.id}>
                  {getDisplayName(m as any, i18n.language)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pendingLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 text-sm font-medium">Fetching pending requests...</p>
          </div>
        ) : !pendingData || pendingData.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Check className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">All Clear!</h3>
            <p className="text-slate-500 text-sm">No pending approvals found for the selected filters.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
            <DataTable 
              columns={columns} 
              data={sortedPendingData}
            />
          </div>
        )}

        {/* Print-only layout */}
        <div className="hidden print:block">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Overall Pending Approvals Report</h1>
            <p className="text-slate-500 mt-2 font-medium">
              Month: {getMonthOptions().find(m => m.value === filters.month)?.label} {filters.year} | 
              Site: {filters.site || 'All Sites'} |
              Manager: {filters.managerId ? managers?.find(m => m.id === filters.managerId)?.name : 'All Managers'}
            </p>
          </div>
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                <th className="py-3 px-4 border-r w-12 text-center">S.No</th>
                <th className="py-3 px-4 border-r">Employee</th>
                <th className="py-3 px-4 border-r">Site</th>
                <th className="py-3 px-4 border-r">Date & Shift</th>
                <th className="py-3 px-4 border-r">Status</th>
                <th className="py-3 px-4 border-r">Assigned Manager</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedPendingData.map((item, index) => (
                <tr key={index} className="text-[11px] border-b border-slate-100">
                  <td className="py-2.5 px-4 border-r text-center font-bold text-slate-400">{index + 1}</td>
                  <td className="py-2.5 px-4 border-r">
                    <div className="font-bold text-slate-900">{getDisplayName(item.employee, i18n.language)}</div>
                    <div className="text-[9px] font-medium text-slate-400">{item.employee?.emp_code}</div>
                  </td>
                  <td className="py-2.5 px-4 border-r font-medium text-slate-600">{item.employee?.site}</td>
                  <td className="py-2.5 px-4 border-r">
                    <div className="font-medium text-slate-700">{formatDate(item.date)}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{item.day_night}</div>
                  </td>
                  <td className="py-2.5 px-4 border-r uppercase font-black text-[9px] text-amber-600">{item.status}</td>
                  <td className="py-2.5 px-4 border-r font-bold text-indigo-600">{getDisplayName(item.manager, i18n.language) || 'N/A'}</td>
                  <td className="py-2.5 px-4 text-right font-black text-slate-900">
                    ₹{(item.category === 'Work' || !item.category) ? (item.employee?.batta_amount || 0) : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isReassignOpen && (
        <ReassignManagerDialog 
          entry={selectedEntry} 
          onClose={() => setIsReassignOpen(false)} 
        />
      )}
    </div>
  )
}
