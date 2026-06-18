import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePendingSupercheckBatta, useRecentSupercheckDecisions, useVerifyBatta } from '../../hooks/useBatta'
import { Check, Edit2, Search, X, Coins, MessageSquare, Calendar, Loader2, SunMoon, Clock, ClipboardCheck, History } from 'lucide-react'
import { formatDate, cn, getMonthOptions, getYearOptions } from '../../lib/utils'
import { toast } from 'sonner'
import { getDisplayName } from '../../lib/userUtils'

export default function SupercheckInbox() {
  const { i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending')
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    period: '',
    date: '',
    search: ''
  })

  // Verify/Edit Dialog State
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    particulars: '',
    category: 'Work' as 'Work' | 'Leave' | 'NoWork',
    approvedAmount: 0,
    dayNight: 'Day' as 'Day' | 'Night',
    time: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Query Hooks
  const { data: pending, isLoading: pendingLoading } = usePendingSupercheckBatta({
    month: Number(filters.month),
    year: Number(filters.year),
    period: filters.period || undefined,
    date: filters.date || undefined,
    search: filters.search
  })

  const { data: recent, isLoading: recentLoading } = useRecentSupercheckDecisions({
    month: Number(filters.month),
    year: Number(filters.year),
    period: filters.period || undefined,
    date: filters.date || undefined,
    search: filters.search
  })

  const verifyBatta = useVerifyBatta()

  const pendingCount = pending?.length || 0
  const recentCount = recent?.length || 0

  const handleOpenVerifyDialog = (entry: any) => {
    setSelectedEntry(entry)
    const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee
    const baseAmount = emp?.batta_amount || 0
    
    setEditForm({
      particulars: entry.particulars,
      category: (entry.category || 'Work') as 'Work' | 'Leave' | 'NoWork',
      approvedAmount: entry.approved_amount !== undefined && entry.approved_amount !== null ? Number(entry.approved_amount) : Number(baseAmount),
      dayNight: (entry.day_night || 'Day') as 'Day' | 'Night',
      time: entry.time || ''
    })
  }

  const handleCategoryChange = (newCategory: 'Work' | 'Leave' | 'NoWork') => {
    const emp = Array.isArray(selectedEntry.employee) ? selectedEntry.employee[0] : selectedEntry.employee
    const baseAmount = emp?.batta_amount || 0

    let amount = baseAmount
    let particulars = editForm.particulars

    if (newCategory === 'Leave') {
      amount = 0
      particulars = 'Leave'
    } else if (newCategory === 'NoWork') {
      amount = 0
      particulars = 'Rest / No Work'
    } else if (newCategory === 'Work' && (editForm.particulars === 'Leave' || editForm.particulars === 'Rest / No Work')) {
      particulars = ''
    }

    setEditForm(prev => ({
      ...prev,
      category: newCategory,
      approvedAmount: amount,
      particulars
    }))
  }

  const handleVerifySubmit = async () => {
    if (!selectedEntry) return
    if (!editForm.particulars.trim()) {
      toast.error('Please enter work particulars.')
      return
    }
    if (editForm.approvedAmount < 0) {
      toast.error('Please enter a valid batta amount.')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyBatta.mutateAsync({
        id: selectedEntry.id,
        particulars: editForm.particulars,
        category: editForm.category,
        approvedAmount: editForm.approvedAmount,
        dayNight: editForm.dayNight,
        time: editForm.dayNight === 'Night' ? editForm.time : undefined
      })
      
      toast.success('Batta verified and forwarded to reporting manager successfully!')
      setSelectedEntry(null)
    } catch (error) {
      toast.error('Failed to verify Batta entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supercheck Verification Inbox</h1>
          <p className="text-slate-500 text-sm mt-0.5">Verify and acknowledge employee submitted Batta allowance details.</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'pending' 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Pending Verification
            {pendingCount > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px]",
                activeTab === 'pending' ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"
              )}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'recent' 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Recently Verified
            {recentCount > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px]",
                activeTab === 'recent' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"
              )}>
                {recentCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employee name, code, or particulars..." 
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
            <option value="1-15">1st - 15th</option>
            <option value="16-end">16th - End</option>
          </select>
        </div>

        <div className="w-48 relative">
          <input 
            type="date" 
            value={filters.date} 
            onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {filters.date && (
            <button 
              onClick={() => setFilters(prev => ({ ...prev, date: '' }))}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Inbox View */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : pendingCount === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
              <ClipboardCheck className="text-emerald-500 mx-auto mb-4" size={48} />
              <h3 className="text-slate-900 font-bold text-lg mb-1">Clear Verification Queue!</h3>
              <p className="text-slate-500">No Batta entries are currently waiting for supercheck verification.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Site / Design.</th>
                        <th className="px-5 py-4">Date & Shift</th>
                        <th className="px-5 py-4">Submitted Particulars</th>
                        <th className="px-5 py-4 text-right">Standard Rate</th>
                        <th className="px-5 py-4 text-center">Verify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pending?.map((entry: any) => {
                        const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{getDisplayName(emp, i18n.language) || 'Unknown'}</span>
                                <span className="text-[10px] font-bold text-slate-400">{emp?.emp_code || '---'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-medium">
                              <div className="flex flex-col">
                                <span className="font-bold">{emp?.site || '-'}</span>
                                <span className="text-[10px] text-slate-400">{emp?.designation || '-'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-600">{formatDate(entry.date)}</span>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                  <SunMoon size={12} className={entry.day_night === 'Night' ? "text-indigo-500" : "text-amber-500"} />
                                  {entry.category === 'Work' || !entry.category ? (
                                    <>{entry.day_night} {entry.time ? `(${entry.time})` : ''}</>
                                  ) : (
                                    <span className="bg-red-50 text-red-600 px-1 rounded-sm">
                                      {entry.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 max-w-xs truncate" title={entry.particulars}>
                              <span className="text-slate-500 italic">"{entry.particulars}"</span>
                            </td>
                            <td className="px-5 py-4 text-right font-black text-indigo-600">
                              ₹{emp?.batta_amount || 0}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center items-center">
                                <button 
                                  onClick={() => handleOpenVerifyDialog(entry)} 
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-all font-bold text-xs flex items-center gap-1.5"
                                  title="Verify & Edit Entry"
                                >
                                  <Edit2 size={14} />
                                  Verify
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {pending?.map((entry: any) => {
                  const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                  return (
                    <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-slate-900 text-lg leading-tight block">{getDisplayName(emp, i18n.language) || 'Unknown'}</span>
                          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{emp?.emp_code || '---'} • {emp?.site || '-'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold leading-none">Rate</span>
                          <span className="text-lg font-black text-indigo-600">₹{emp?.batta_amount || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 py-2 border-y border-slate-50">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                          <span className="text-sm font-bold text-slate-700">{formatDate(entry.date)}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-100" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Shift</span>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <SunMoon size={14} className={entry.day_night === 'Night' ? "text-indigo-500" : "text-amber-500"} />
                            {entry.category === 'Work' || !entry.category ? entry.day_night : entry.category}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          "{entry.particulars}"
                        </p>
                      </div>

                      <button 
                        onClick={() => handleOpenVerifyDialog(entry)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm mt-1"
                      >
                        <Edit2 size={16} />
                        Verify Allowance
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4">
          {recentLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : recentCount === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
              <History className="text-amber-500 mx-auto mb-4" size={48} />
              <p className="text-slate-500 text-sm">No recently verified Batta entries found.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Verified Work Details</th>
                        <th className="px-5 py-4 text-center">Batta Stage</th>
                        <th className="px-5 py-4 text-right">Verified Amount</th>
                        <th className="px-5 py-4 text-center">Modify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {recent?.map((entry: any) => {
                        const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-900">{getDisplayName(emp, i18n.language)}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold">{formatDate(entry.date)}</span>
                                <span className="text-[10px] text-slate-400 font-medium uppercase">{entry.day_night}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700">"{entry.particulars}"</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.category || 'Work'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                entry.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                entry.status === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                "bg-red-50 text-red-600 border border-red-100"
                              )}>
                                {entry.status === 'pending' ? 'Pending Manager' : entry.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-black text-emerald-600">
                              ₹{entry.approved_amount ?? emp?.batta_amount ?? 0}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center items-center">
                                {entry.status === 'pending' ? (
                                  <button 
                                    onClick={() => handleOpenVerifyDialog(entry)} 
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Modify Verification Details"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic font-medium">Locked (Manager actioned)</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {recent?.map((entry: any) => {
                  const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                  return (
                    <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 leading-tight block">{getDisplayName(emp, i18n.language)}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{formatDate(entry.date)} • {entry.day_night}</span>
                        <div>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider",
                            entry.status === 'pending' ? "bg-amber-50 text-amber-600" :
                            entry.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                            {entry.status === 'pending' ? 'Pending Manager' : entry.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Verified</span>
                          <span className="text-sm font-black text-emerald-600">₹{entry.approved_amount ?? emp?.batta_amount ?? 0}</span>
                        </div>
                        {entry.status === 'pending' && (
                          <button 
                            onClick={() => handleOpenVerifyDialog(entry)}
                            className="p-2 text-slate-400 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Verify & Edit Dialog Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Title Banner */}
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Verify & Acknowledge Batta</h3>
                <p className="text-white/80 text-xs mt-0.5">Review, correct, and forward allowance details to the reporting manager.</p>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 space-y-6">
              {/* Employee & Date Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Employee</span>
                  <span className="font-bold text-slate-800 text-sm">{getDisplayName(Array.isArray(selectedEntry.employee) ? selectedEntry.employee[0] : selectedEntry.employee, i18n.language)}</span>
                  <span className="text-slate-500 block">Code: {(Array.isArray(selectedEntry.employee) ? selectedEntry.employee[0] : selectedEntry.employee)?.emp_code || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block tracking-wider mb-0.5">Date & Shift</span>
                  <span className="font-bold text-slate-800 text-sm">{formatDate(selectedEntry.date)}</span>
                  <span className="text-slate-500 block uppercase font-bold">{selectedEntry.day_night} Shift</span>
                </div>
              </div>

              {/* Work Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" />
                  Work Type (Category)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Work', 'Leave', 'NoWork'].map((type) => (
                    <label 
                      key={type}
                      className={cn(
                        "flex items-center justify-center py-2.5 border rounded-xl cursor-pointer transition-all text-xs font-bold",
                        editForm.category === type 
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm" 
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <input 
                        type="radio" 
                        name="category" 
                        value={type} 
                        checked={editForm.category === type} 
                        onChange={() => handleCategoryChange(type as any)} 
                        className="hidden" 
                      />
                      {type === 'NoWork' ? 'No Work' : type}
                    </label>
                  ))}
                </div>
              </div>

              {/* Shift details (Day / Night / Time) */}
              <div className={cn("space-y-4", editForm.category !== 'Work' ? "opacity-40 grayscale pointer-events-none" : "opacity-100")}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <SunMoon size={14} className="text-indigo-500" />
                      Shift
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={cn(
                        "flex items-center justify-center py-2 border rounded-xl cursor-pointer transition-all text-xs font-bold",
                        editForm.dayNight === 'Day' ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>
                        <input 
                          type="radio" 
                          name="dayNight" 
                          value="Day" 
                          checked={editForm.dayNight === 'Day'} 
                          onChange={() => setEditForm(prev => ({ ...prev, dayNight: 'Day' }))} 
                          className="hidden" 
                        />
                        Day
                      </label>
                      <label className={cn(
                        "flex items-center justify-center py-2 border rounded-xl cursor-pointer transition-all text-xs font-bold",
                        editForm.dayNight === 'Night' ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>
                        <input 
                          type="radio" 
                          name="dayNight" 
                          value="Night" 
                          checked={editForm.dayNight === 'Night'} 
                          onChange={() => setEditForm(prev => ({ ...prev, dayNight: 'Night' }))} 
                          className="hidden" 
                        />
                        Night
                      </label>
                    </div>
                  </div>

                  {editForm.dayNight === 'Night' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock size={14} className="text-indigo-500" />
                        Time
                      </label>
                      <input 
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Work Particulars (Details) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-500" />
                  Work Particulars
                </label>
                <textarea
                  value={editForm.particulars}
                  onChange={(e) => setEditForm(prev => ({ ...prev, particulars: e.target.value }))}
                  placeholder="Review/correct the work particulars..."
                  rows={3}
                  disabled={editForm.category !== 'Work'}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm resize-none disabled:bg-slate-50 disabled:text-slate-400 disabled:italic"
                />
              </div>

              {/* Verified Batta Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Coins size={16} className="text-indigo-500" />
                  Batta Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={editForm.approvedAmount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, approvedAmount: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    placeholder="Enter verified batta amount..."
                    disabled={editForm.category !== 'Work'}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
              <button 
                onClick={() => setSelectedEntry(null)} 
                className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifySubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Acknowledging...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Acknowledge & Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
