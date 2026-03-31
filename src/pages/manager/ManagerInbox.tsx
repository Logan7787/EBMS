import { useTranslation } from 'react-i18next'
import { usePendingTeamBatta, useUpdateBattaStatus, useRecentTeamDecisions } from '../../hooks/useBatta'
import { Check, X, AlertCircle, Coins, SunMoon, RotateCcw, History } from 'lucide-react'
import { formatDate, cn } from '../../lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ManagerInbox() {
  const { t } = useTranslation()
  const { data: pending, isLoading } = usePendingTeamBatta()
  const { data: recent, isLoading: recentLoading } = useRecentTeamDecisions()
  const { mutateAsync: updateStatus } = useUpdateBattaStatus()
  
  const [selectedItem, setSelectedItem] = useState<{ id: string; action: 'approved' | 'rejected' | 'fined' } | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'recent'>('pending')
  const [rejectReason, setRejectReason] = useState('')
  const [fineAmount, setFineAmount] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingCount = pending?.length || 0
  const recentCount = recent?.length || 0

  const handleReset = async (id: string) => {
    if (!confirm("Are you sure you want to reset this entry to pending?")) return
    setIsSubmitting(true)
    try {
      await updateStatus({ id, status: 'pending' })
      toast.success("Entry reset to pending")
    } catch (error) {
      toast.error(t('messages.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAction = async () => {
    if (!selectedItem) return
    
    if (selectedItem.action === 'rejected' && !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.")
      return
    }

    if (selectedItem.action === 'fined' && (fineAmount === '' || Number(fineAmount) < 0)) {
      toast.error("Please enter a valid fine amount.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = { 
        id: selectedItem.id, 
        status: selectedItem.action === 'fined' ? 'approved' : selectedItem.action 
      }
      
      if (selectedItem.action === 'rejected') {
        payload.rejectReason = rejectReason
      }
      
      if (selectedItem.action === 'fined') {
        payload.approvedAmount = Number(fineAmount)
      }

      await updateStatus(payload)
      toast.success(t('messages.saved'))
      
      setSelectedItem(null)
      setRejectReason('')
      setFineAmount('')
    } catch (error) {
      toast.error(t('messages.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Inbox</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and review your team's batta requests.</p>
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
            Pending
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
            Recent Decisions
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

      {activeTab === 'pending' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {pending?.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
              <Check className="text-emerald-500 mx-auto mb-4" size={48} />
              <h3 className="text-slate-900 font-bold text-lg mb-1">{t('messages.noData')}</h3>
              <p className="text-slate-500">All caught up! No requests waiting for your review.</p>
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
                        <th className="px-5 py-4">Designation</th>
                        <th className="px-5 py-4">Date & Shift</th>
                        <th className="px-5 py-4 max-w-xs truncate">Particulars</th>
                        <th className="px-5 py-4 text-right">Standard Batta</th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pending?.map((entry) => {
                        const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{emp?.name || 'Unknown'}</span>
                                <span className="text-[10px] font-bold text-slate-400">{emp?.emp_code || '---'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-medium">{emp?.designation || emp?.site || '-'}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-600">{formatDate(entry.date)}</span>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                  <SunMoon size={12} className={entry.day_night === 'Night' ? "text-indigo-500" : "text-amber-500"} />
                                  {entry.category === 'Work' || !entry.category ? (
                                    <>{entry.day_night} {entry.time ? `(${entry.time})` : ''}</>
                                  ) : (
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded-sm",
                                      entry.category === 'Leave' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                      {entry.category === 'Leave' ? 'Leave' : 'No Work'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 max-w-xs truncate" title={entry.particulars}>
                              <span className="text-slate-500 italic">"{entry.particulars}"</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-lg font-black text-indigo-600">
                                ₹{(entry.category === 'Work' || !entry.category) ? (emp?.batta_amount || 0) : 0}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center items-center gap-2">
                                <button onClick={() => setSelectedItem({ id: entry.id, action: 'approved' })} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all" title="Approve exactly as is"><Check size={18} /></button>
                                <button onClick={() => { setFineAmount(emp?.batta_amount || 0); setSelectedItem({ id: entry.id, action: 'fined' }); }} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all" title="Fine / Adjust Amount"><Coins size={18} /></button>
                                <button onClick={() => setSelectedItem({ id: entry.id, action: 'rejected' })} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Reject fully"><X size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden space-y-4">
                {pending?.map((entry) => {
                  const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                  const stdAmount = (entry.category === 'Work' || !entry.category) ? (emp?.batta_amount || 0) : 0;
                  return (
                    <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg leading-tight">{emp?.name || 'Unknown'}</span>
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{emp?.emp_code || '---'} • {emp?.designation || '-'}</span>
                          </div>
                          <div className="bg-indigo-50 px-3 py-1.5 rounded-xl flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase text-indigo-400 leading-none mb-1">Standard</span>
                            <span className="text-lg font-black text-indigo-600 leading-none">₹{stdAmount}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 py-2 border-y border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                            <span className="text-sm font-bold text-slate-700">{formatDate(entry.date)}</span>
                          </div>
                          <div className="h-6 w-px bg-slate-100" />
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Shift</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                              <SunMoon size={14} className={entry.day_night === 'Night' ? "text-indigo-500" : "text-amber-500"} />
                              {entry.category === 'Work' || !entry.category ? entry.day_night : entry.category}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                          <p className="text-xs text-slate-600 italic line-clamp-2 leading-relaxed">
                            "{entry.particulars}"
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-100 mt-auto">
                        <button 
                          onClick={() => setSelectedItem({ id: entry.id, action: 'approved' })}
                          className="bg-white py-4 px-2 flex flex-col items-center justify-center gap-1 hover:bg-emerald-50 text-emerald-600 transition-all active:scale-95"
                        >
                          <Check size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                        </button>
                        <button 
                          onClick={() => { setFineAmount(emp?.batta_amount || 0); setSelectedItem({ id: entry.id, action: 'fined' }); }}
                          className="bg-white py-4 px-2 flex flex-col items-center justify-center gap-1 hover:bg-amber-50 text-amber-600 transition-all active:scale-95"
                        >
                          <Coins size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Adjust</span>
                        </button>
                        <button 
                          onClick={() => setSelectedItem({ id: entry.id, action: 'rejected' })}
                          className="bg-white py-4 px-2 flex flex-col items-center justify-center gap-1 hover:bg-red-50 text-red-600 transition-all active:scale-95"
                        >
                          <X size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {recentLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : recent?.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
              <History className="text-amber-500 mx-auto mb-4" size={48} />
              <p className="text-slate-500 text-sm">No recent decisions found.</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Decision</th>
                        <th className="px-5 py-4 text-right">Amount</th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {recent?.map((entry) => {
                        const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-900">{emp?.name}</td>
                            <td className="px-5 py-4">{formatDate(entry.date)}</td>
                            <td className="px-5 py-4 uppercase text-[10px] font-black tracking-widest">
                              <span className={cn(
                                "px-2 py-1 rounded-full",
                                entry.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {entry.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-black">
                              ₹{entry.approved_amount ?? emp?.batta_amount}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center items-center gap-2">
                                <button onClick={() => handleReset(entry.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Reset to Pending"><RotateCcw size={16} /></button>
                                <button onClick={() => { setFineAmount(entry.approved_amount ?? emp?.batta_amount); setSelectedItem({ id: entry.id, action: 'fined' }); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Modify Decision"><Coins size={16} /></button>
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
                {recent?.map((entry) => {
                  const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                  return (
                    <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-tight">{emp?.name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{formatDate(entry.date)}</span>
                        <div className="mt-1">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                            entry.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase text-slate-400 block leading-none mb-1">Final</span>
                          <span className="text-sm font-black text-slate-900 block leading-none">₹{entry.approved_amount ?? emp?.batta_amount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <button onClick={() => handleReset(entry.id)} className="p-2 text-slate-400 hover:bg-indigo-50 rounded-xl transition-all"><RotateCcw size={18} /></button>
                           <button onClick={() => { setFineAmount(entry.approved_amount ?? emp?.batta_amount); setSelectedItem({ id: entry.id, action: 'fined' }); }} className="p-2 text-slate-400 hover:bg-amber-50 rounded-xl transition-all"><Coins size={18} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Approve Dialog */}
      {selectedItem?.action === 'approved' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Approve Request</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to approve this batta entry?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
              <button onClick={handleAction} disabled={isSubmitting} className="px-6 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md">
                {isSubmitting ? 'Approving...' : 'Yes, Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {selectedItem?.action === 'rejected' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Request</h3>
            <p className="text-slate-500 text-sm mb-6">Provide a reason for denying this request.</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400 mb-6"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 font-bold text-slate-500">Cancel</button>
              <button 
                onClick={handleAction}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-6 py-2 font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fine Dialog */}
      {selectedItem?.action === 'fined' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
              <Coins size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Fine Employee / Adjust Batta</h3>
            <p className="text-slate-500 text-sm mb-6">Enter the final modified amount this employee will receive.</p>
            
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              <input
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Amount"
                min="0"
                className="w-full pl-8 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 text-xl font-bold"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-8">
              {[0, 0.5, 0.75].map((ratio) => {
                const entry = pending?.find(e => e.id === selectedItem.id) || recent?.find(e => e.id === selectedItem.id);
                const emp = entry ? (Array.isArray(entry.employee) ? entry.employee[0] : entry.employee) : null;
                const stdBatta = emp?.batta_amount || 0;
                const calculated = Math.round(stdBatta * ratio);
                
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setFineAmount(calculated)}
                    className="py-2.5 rounded-xl border border-amber-100 bg-amber-50/50 text-amber-700 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95"
                  >
                    {ratio === 0 ? 'Zero' : `${ratio * 100}%`}
                    <span className="block text-xs font-black">₹{calculated}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 font-bold text-slate-500">Cancel</button>
              <button 
                onClick={handleAction}
                disabled={isSubmitting || fineAmount === '' || Number(fineAmount) < 0}
                className="px-6 py-3 font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl shadow-lg shadow-amber-100"
              >
                {isSubmitting ? 'Saving...' : `Approve (₹${fineAmount || 0})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
