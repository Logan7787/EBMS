import { useTranslation } from 'react-i18next'
import { usePendingTeamBatta, useUpdateBattaStatus } from '../../hooks/useBatta'
import { Check, X, AlertCircle, Coins, SunMoon } from 'lucide-react'
import { formatDate, cn } from '../../lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ManagerInbox() {
  const { t } = useTranslation()
  const { data: pending, isLoading } = usePendingTeamBatta()
  const { mutateAsync: updateStatus } = useUpdateBattaStatus()
  
  const [selectedItem, setSelectedItem] = useState<{ id: string; action: 'approved' | 'rejected' | 'fined' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [fineAmount, setFineAmount] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Check size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and process your team's batta requests efficiently.</p>
        </div>
      </div>

      {pending?.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
          <Check className="text-emerald-500 mx-auto mb-4" size={48} />
          <h3 className="text-slate-900 font-bold text-lg mb-1">{t('messages.noData')}</h3>
          <p className="text-slate-500">All caught up! No requests waiting for your review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                  // Prevent mapping array issues from Supabase joins
                  const emp = Array.isArray(entry.employee) ? entry.employee[0] : entry.employee;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{emp?.name || 'Unknown'}</span>
                          <span className="text-[10px] font-bold text-slate-400">{emp?.emp_code || '---'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {emp?.designation || emp?.site || '-'}
                      </td>
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
                          <button 
                            onClick={() => setSelectedItem({ id: entry.id, action: 'approved' })}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                            title="Approve exactly as is"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setFineAmount(emp?.batta_amount || 0);
                              setSelectedItem({ id: entry.id, action: 'fined' });
                            }}
                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                            title="Fine / Adjust Amount"
                          >
                            <Coins size={18} />
                          </button>
                          <button 
                            onClick={() => setSelectedItem({ id: entry.id, action: 'rejected' })}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            title="Reject fully"
                          >
                            <X size={18} />
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

            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 font-bold text-slate-500">Cancel</button>
              <button 
                onClick={handleAction}
                disabled={isSubmitting || fineAmount === '' || Number(fineAmount) < 0}
                className="px-6 py-2 font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl"
              >
                Approve (₹{fineAmount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
