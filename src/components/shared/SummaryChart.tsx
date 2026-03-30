import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ChartData {
  label: string
  value: number
  color?: string
}

interface SummaryChartProps {
  title: string
  data: ChartData[]
  height?: number
  className?: string
}

export function SummaryChart({ title, data, className }: SummaryChartProps) {
  const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])

  return (
    <div className={cn("bg-white p-6 rounded-2xl border border-slate-100 shadow-sm", className)}>
      <h3 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
        <div className="w-1 h-4 bg-indigo-600 rounded-full" />
        {title}
      </h3>
      
      <div className="space-y-5">
        {data.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 tracking-wide uppercase">{item.label}</span>
              <span className="text-indigo-600 font-bold">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / max) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full shadow-sm",
                  item.color || "bg-gradient-to-r from-indigo-500 to-indigo-600"
                )}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-end">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Impact</p>
          <p className="text-2xl font-black text-slate-900">
            {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
