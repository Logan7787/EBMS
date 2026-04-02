import { AlertCircle } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'

interface MissingBattaAlertProps {
  entries: any[] | undefined
}

export function MissingBattaAlert({ entries }: MissingBattaAlertProps) {
  const user = useAuthStore(s => s.user)
  
  // Only show if user has a non-zero batta amount
  if (!user || (user.battaAmount || 0) <= 0) return null

  // Calculate missing days for the marquee
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentDay = new Date().getDate()
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const periodStart = currentDay <= 15 ? 1 : 16
  
  const missingDates: string[] = []
  for (let d = periodStart; d <= currentDay; d++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(currentYear, currentMonth - 1, d)
    
    // Skip Sundays
    if (dateObj.getDay() === 0) continue
    
    // Check if entry exists (any status)
    const exists = entries?.some(e => e.date === dateStr)
    if (!exists) {
      missingDates.push(formatDate(dateStr))
    }
  }

  if (missingDates.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
      <div className="flex items-center px-6 py-3 bg-amber-100/50 border-b border-amber-100">
        <AlertCircle className="text-amber-600 mr-2" size={20} />
        <span className="text-sm font-bold text-amber-800 uppercase tracking-tight">Missing Batta Submission</span>
      </div>
      <div className="bg-black/5 py-2 px-4">
        <div className="whitespace-nowrap animate-marquee flex gap-8">
          {[1, 2, 3].map((i) => (
            <span key={i} className="text-sm font-bold text-amber-700">
              ⚠️ You have not submitted your batta yet for: <span className="underline decoration-2 underline-offset-4">{missingDates.join(', ')}</span>. Please submit now to avoid processing delays!
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
