import { ReactNode, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T, index: number) => ReactNode)
  className?: string
  sortable?: boolean
  sortKey?: string // Useful if accessor is a function
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data?: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
}

export function DataTable<T>({ columns, data, loading, emptyMessage, onRowClick }: DataTableProps<T>) {
  const { t } = useTranslation()
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const sortedData = useMemo(() => {
    if (!data || !sortConfig) return data

    return [...data].sort((a, b) => {
      const key = sortConfig.key as keyof T
      const aValue = a[key]
      const bValue = b[key]

      if (aValue === bValue) return 0
      
      const comparison = aValue > bValue ? 1 : -1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    const key = (column.sortKey || (typeof column.accessor === 'string' ? column.accessor : '')) as string
    if (!key) return

    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center px-6 gap-4">
          {columns.map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 rounded-full animate-pulse" style={{ width: `${100 / columns.length}%` }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 border-b border-slate-100 last:border-0 flex items-center px-6 gap-4">
            {columns.map((_, j) => (
              <div key={j} className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: `${100 / columns.length}%` }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-slate-900 font-bold text-lg mb-1">{t('messages.noData')}</h3>
        <p className="text-slate-500 text-sm max-w-xs">{emptyMessage || "We couldn't find any records matching your current criteria."}</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100">
              {columns.map((col, idx) => {
                const isSortable = col.sortable && (col.sortKey || typeof col.accessor === 'string')
                const isCurrentSort = sortConfig?.key === (col.sortKey || col.accessor)
                
                return (
                  <th 
                    key={idx} 
                    className={cn(
                      "py-5 px-6 font-bold select-none whitespace-nowrap", 
                      isSortable && "cursor-pointer hover:text-indigo-600 transition-colors",
                      col.className
                    )}
                    onClick={() => isSortable && handleSort(col)}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {isSortable && (
                        <div className="text-slate-300 transition-colors">
                          {isCurrentSort ? (
                            sortConfig?.direction === 'asc' ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />
                          ) : (
                            <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedData.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                className={cn(
                  "hover:bg-indigo-50/30 transition-all duration-200 group",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn("py-4 px-6 text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors", col.className)}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item, rowIdx) 
                      : (item[col.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
