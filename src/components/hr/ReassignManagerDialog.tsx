import { Loader2, X, UserCheck } from 'lucide-react'
import { useManagers } from '../../hooks/useEmployees'
import { useUpdateBattaManager } from '../../hooks/useBatta'
import { toast } from 'sonner'
import { useState } from 'react'

interface ReassignManagerDialogProps {
  entry: any
  onClose: () => void
}

export default function ReassignManagerDialog({ entry, onClose }: ReassignManagerDialogProps) {
  const { data: managers, isLoading: managersLoading } = useManagers()
  const updateManager = useUpdateBattaManager()
  const [selectedManagerId, setSelectedManagerId] = useState(entry.manager_id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReassign = async () => {
    if (!selectedManagerId) {
      toast.error("Please select a manager.")
      return
    }

    setIsSubmitting(true)
    try {
      await updateManager.mutateAsync({ id: entry.id, managerId: selectedManagerId })
      toast.success("Manager reassigned successfully!")
      onClose()
    } catch (error) {
      toast.error("Failed to reassign manager.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <UserCheck size={24} />
            <h3 className="font-bold text-lg">Reassign Manager</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee</p>
              <p className="font-bold text-slate-900">{entry.employee?.name}</p>
              <p className="text-xs text-slate-500">{entry.employee?.emp_code}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Select New Reporting Manager</label>
              {managersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              ) : (
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">Select Manager...</option>
                  {managers?.filter((m: any) => m.id !== entry.emp_id).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={isSubmitting || !selectedManagerId}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Update Manager"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
