import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'red' | 'blue'
  icon?: ReactNode
  className?: string
}

export function StatCard({ title, value, subtitle, color = 'indigo', icon, className }: StatCardProps) {
  const borderStyles = {
    indigo: "border-indigo-500",
    emerald: "border-emerald-500",
    amber: "border-amber-500",
    purple: "border-purple-500",
    red: "border-red-500",
    blue: "border-blue-500"
  }

  return (
    <div className={cn(
      "bg-white rounded-xl p-6 shadow-sm border-l-4 transition-all hover:shadow-md",
      borderStyles[color],
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              subtitle.startsWith('+') ? "text-emerald-600" : "text-slate-400"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-2 rounded-lg bg-opacity-10",
            color === 'indigo' ? "bg-indigo-500 text-indigo-600" :
            color === 'emerald' ? "bg-emerald-500 text-emerald-600" :
            color === 'amber' ? "bg-amber-500 text-amber-600" :
            color === 'purple' ? "bg-purple-500 text-purple-600" :
            "bg-slate-500 text-slate-600"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
