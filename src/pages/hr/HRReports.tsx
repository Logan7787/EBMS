import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { useEmployees } from '../../hooks/useEmployees'
import { useGlobalBattaReport, useMissingSubmissions } from '../../hooks/useBatta'
import { Download, Search, Plus, Minus, Loader2, X } from 'lucide-react'
import { cn, getMonthOptions, getYearOptions, formatDate } from '../../lib/utils'

export default function HRReports() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'batta' | 'active' | 'paysheet' | 'missing'>('batta')
  const { data: employees, isLoading: employeesLoading } = useEmployees()
  
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    period: '',
    date: '',
    site: '',
    search: ''
  })

  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const { data: reportData, isLoading: reportLoading } = useGlobalBattaReport(
    Number(filters.month), 
    Number(filters.year), 
    filters.period || undefined,
    filters.site || undefined,
    filters.date || undefined
  )

  const { data: missingData, isLoading: missingLoading } = useMissingSubmissions(
    Number(filters.month),
    Number(filters.year),
    filters.period || undefined,
    filters.site || undefined,
    filters.date || undefined
  )

  const toggleRow = (empId: string) => {
    setExpandedRows(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    )
  }

  const sites = Array.from(new Set(employees?.map(e => e.site).filter(Boolean)))

  const filteredBatta = reportData?.filter(item => 
    item.name.toLowerCase().includes(filters.search.toLowerCase()) || 
    item.emp_code.toLowerCase().includes(filters.search.toLowerCase())
  ) || []

  const filteredActive = employees?.filter(e => 
    e.active && 
    (!filters.site || e.site === filters.site) &&
    (e.name.toLowerCase().includes(filters.search.toLowerCase()) || 
     e.emp_code.toLowerCase().includes(filters.search.toLowerCase()))
  )?.sort((a, b) => {
    const catgA = a.catg_code || '999'
    const catgB = b.catg_code || '999'
    if (catgA !== catgB) {
      return catgA.localeCompare(catgB, undefined, { numeric: true })
    }
    return a.name.localeCompare(b.name)
  }) || []



  const activeColumns = [
    { 
      header: 'S.No', 
      accessor: (_: any, index: number) => index + 1,
      className: 'w-12 text-center font-bold text-slate-400'
    },
    { header: t('employee.code'), accessor: 'emp_code' as const },
    { header: t('employee.name'), accessor: 'name' as const },
    { header: 'CATG', accessor: 'catg_code' as const, className: 'w-16 text-center font-bold text-indigo-600' },
    { header: t('employee.designation'), accessor: 'designation' as const },
    { header: t('employee.site'), accessor: 'site' as const },
    { header: t('employee.rate'), accessor: (item: any) => `₹${item.batta_amount}` }
  ]

  const exportCSV = () => {
    if (activeTab === 'missing') {
      if (!missingData || missingData.length === 0) return
      
      const headers = ['EmpCode', 'Name', 'CATG', 'Designation', 'Site', 'Missing Dates', 'Count']
      const rows = (missingData || [])
        .filter(m => (m.name.toLowerCase().includes(filters.search.toLowerCase()) || m.emp_code.toLowerCase().includes(filters.search.toLowerCase())))
        .map(item => [
          item.emp_code,
          item.name,
          item.catg_code,
          item.designation,
          item.site,
          item.missingDates.join(' | '),
          item.missingCount
        ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const fileName = `Missing_Submissions_${filters.month}_${filters.year}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    if (!reportData || reportData.length === 0) return

    const headers = ['EmpCode', 'Name', 'CATG', 'Designation', 'Site', 'Day', 'Night', 'Total Amount']
    const rows = filteredBatta.map(item => [
      item.emp_code,
      item.name,
      item.catg_code,
      item.designation,
      item.site,
      item.dayCount.toFixed(1),
      item.nightCount.toFixed(1),
      item.total
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const fileName = `Batta_Report_${filters.month}_${filters.year}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('nav.report')} 
        subtitle="Generate and export system-wide reports."
        action={
          <div className="flex items-center gap-3 print:hidden">
            {(activeTab === 'paysheet' || activeTab === 'missing') && (
              <button 
                onClick={() => window.print()}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
              >
                <Download size={18} />
                Download PDF
              </button>
            )}
            <button 
              onClick={exportCSV}
              className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-all"
            >
              <Download size={18} />
              {t('actions.download')} CSV
            </button>
          </div>
        }
      />

      <div className="border-b border-slate-200">
        <nav className="flex gap-8 print:hidden">
          <button
            onClick={() => setActiveTab('batta')}
            className={cn(
              "pb-4 text-sm font-semibold transition-colors relative",
              activeTab === 'batta' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Batta Report
            {activeTab === 'batta' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('paysheet')}
            className={cn(
              "pb-4 text-sm font-semibold transition-colors relative",
              activeTab === 'paysheet' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Paysheet
            {activeTab === 'paysheet' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "pb-4 text-sm font-semibold transition-colors relative",
              activeTab === 'active' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Active Employees
            {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={cn(
              "pb-4 text-sm font-semibold transition-colors relative",
              activeTab === 'missing' ? "text-red-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Missing Submissions
            {activeTab === 'missing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />}
          </button>
        </nav>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4 mb-6 print:hidden">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or code..." 
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
          
          {(activeTab === 'batta' || activeTab === 'paysheet' || activeTab === 'missing') && (
            <>
              <div className="w-36">
                <select 
                  value={filters.month}
                  onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 font-medium"
                >
                  {getMonthOptions().map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <select 
                  value={filters.year}
                  onChange={e => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 font-medium"
                >
                  {getYearOptions().map(y => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-32">
                <select 
                  value={filters.period}
                  onChange={e => setFilters(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 font-medium"
                >
                  <option value="">Full Month</option>
                  <option value="1">Period 1 (1-15)</option>
                  <option value="2">Period 2 (16-31)</option>
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
            </>
          )}

          <div className="w-48">
            <select 
              value={filters.site}
              onChange={e => setFilters(prev => ({ ...prev, site: e.target.value }))}
              className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50 font-medium"
            >
              <option value="">All Sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {activeTab === 'active' ? (
          <DataTable 
            columns={activeColumns}
            data={filteredActive}
            loading={employeesLoading}
          />
        ) : (reportLoading || missingLoading) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 text-sm font-medium">Generating Report...</p>
          </div>
        ) : activeTab === 'missing' ? (
          <div className="overflow-x-auto print:overflow-visible">
            <div className="hidden print:block mb-8 text-center">
              <h1 className="text-2xl font-bold text-red-600 uppercase">Missing Submissions Report</h1>
              <p className="text-slate-500 mt-1">
                Month: {getMonthOptions().find(m => m.value === filters.month)?.label} {filters.year} | 
                Period: {filters.period === '1' ? '1st to 15th' : filters.period === '2' ? '16th to 31st' : 'Full Month'} |
                Site: {filters.site || 'All Sites'}
                {filters.date && ` | Specific Date: ${formatDate(filters.date)}`}
              </p>
            </div>
             <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                  <th className="py-4 px-6 w-12 text-center border-r">S.No</th>
                  <th className="py-4 px-6 border-r">Emp Code</th>
                  <th className="py-4 px-6 border-r">Name</th>
                  <th className="py-4 px-6 text-center border-r">CATG</th>
                  <th className="py-4 px-6 border-r">Designation</th>
                  <th className="py-4 px-6 border-r">Site</th>
                  <th className="py-4 px-6 border-r">Missing Dates</th>
                  <th className="py-4 px-6 text-center">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(missingData || [])
                  .filter(m => (m.name.toLowerCase().includes(filters.search.toLowerCase()) || m.emp_code.toLowerCase().includes(filters.search.toLowerCase())))
                  .map((item, index) => (
                  <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">
                    <td className="py-4 px-6 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{item.emp_code}</td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-700">{item.name}</td>
                    <td className="py-4 px-6 text-sm text-center font-black text-red-600">
                      <span className="bg-red-50 px-2 py-1 rounded-md">{item.catg_code}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 italic">{item.designation}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{item.site}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {item.missingDates.map(d => (
                          <span key={d} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                            {formatDate(d)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                        {item.missingCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {missingData?.length === 0 && (
              <div className="text-center py-20 text-emerald-600 font-bold">
                ✨ Excellent! No missing submissions found.
              </div>
            )}
          </div>
        ) : filteredBatta.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">No records found for this period.</div>
        ) : activeTab === 'paysheet' ? (
          <div className="overflow-x-auto print:overflow-visible">
            <div className="hidden print:block mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900 uppercase">Paysheet Report</h1>
              <p className="text-slate-500 mt-1">
                Month: {getMonthOptions().find(m => m.value === filters.month)?.label} {filters.year} | 
                Period: {filters.period === '1' ? '1st to 15th' : filters.period === '2' ? '16th to 31st' : 'Full Month'} |
                Site: {filters.site || 'All Sites'}
              </p>
            </div>
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 font-bold border-r border-slate-200 w-12 text-center">S.No</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200">EmpCode</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200">Name</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200 text-center">CATG</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200">Designation</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200">Site</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200 text-center">Day</th>
                  <th className="py-3 px-4 font-bold border-r border-slate-200 text-center">Night</th>
                  <th className="py-3 px-4 font-bold text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBatta.map((item, index) => (
                  <tr key={item.emp_id} className="text-sm border-b border-slate-100 last:border-0">
                    <td className="py-3 px-4 border-r border-slate-200 text-center font-medium text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 border-r border-slate-200 text-slate-900 font-medium">{item.emp_code}</td>
                    <td className="py-3 px-4 border-r border-slate-200 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4 border-r border-slate-200 text-center font-bold text-indigo-600 bg-indigo-50/30">{item.catg_code}</td>
                    <td className="py-3 px-4 border-r border-slate-200 text-slate-600 italic">{item.designation}</td>
                    <td className="py-3 px-4 border-r border-slate-200 text-slate-600">{item.site}</td>
                    <td className="py-3 px-4 border-r border-slate-200 text-center text-slate-600">{+item.dayCount.toFixed(1)}</td>
                    <td className="py-3 px-4 border-r border-slate-200 text-center text-slate-600">{+item.nightCount.toFixed(1)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 font-bold border-t-2 border-slate-200">
                  <td colSpan={6} className="py-4 px-6 text-right text-slate-600 uppercase tracking-wider text-xs border-r border-slate-200">GRAND TOTAL</td>
                  <td className="py-4 px-4 text-center border-r border-slate-200 text-indigo-600">
                    {+filteredBatta.reduce((sum, item) => sum + item.dayCount, 0).toFixed(1)}
                  </td>
                  <td className="py-4 px-4 text-center border-r border-slate-200 text-purple-600">
                    {+filteredBatta.reduce((sum, item) => sum + item.nightCount, 0).toFixed(1)}
                  </td>
                  <td className="py-4 px-6 text-right text-indigo-700 text-lg">
                    ₹{filteredBatta.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-y border-slate-100">
                <th className="py-4 px-6 w-10"></th>
                <th className="py-4 px-6 font-semibold">EmpCode</th>
                <th className="py-4 px-6 font-semibold">Name</th>
                <th className="py-4 px-6 font-semibold text-center">CATG</th>
                <th className="py-4 px-6 font-semibold">Designation</th>
                <th className="py-4 px-6 font-semibold">Site</th>
                <th className="py-4 px-6 font-semibold text-center">Day</th>
                <th className="py-4 px-6 font-semibold text-center">Night</th>
                <th className="py-4 px-6 font-semibold text-center text-red-500">Gaps</th>
                <th className="py-4 px-6 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatta.map((item) => (
                <React.Fragment key={item.emp_id}>
                  <tr className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => toggleRow(item.emp_id)}
                        className={cn(
                          "p-1 rounded-md transition-all",
                          expandedRows.includes(item.emp_id) ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400 group-hover:text-indigo-600"
                        )}
                      >
                        {expandedRows.includes(item.emp_id) ? <Minus size={14} /> : <Plus size={14} />}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{item.emp_code}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-700">{item.name}</td>
                    <td className="py-4 px-6 text-sm text-center font-bold text-indigo-600">
                      <span className="bg-indigo-50 px-2 py-1 rounded-md">{item.catg_code}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 italic">{item.designation}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{item.site}</td>
                    <td className="py-4 px-6 text-sm text-center text-slate-600 font-medium">
                      <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold">{+item.dayCount.toFixed(1)}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-center text-slate-600 font-medium">
                      <span className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full text-xs font-bold">{+item.nightCount.toFixed(1)}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-center text-slate-600 font-medium">
                      {item.missingCount > 0 && (
                        <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold">{item.missingCount}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-right font-bold text-slate-900">₹{item.total}</td>
                  </tr>
                  
                  {expandedRows.includes(item.emp_id) && (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ml-10">
                          <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Timeline</span>
                            {item.missingCount > 0 && (
                              <button 
                                onClick={() => {
                                  const missingDates = item.gaps.filter((g: any) => g.status === 'missing').map((g: any) => formatDate(g.date)).join(', ')
                                  navigator.clipboard.writeText(`Hi ${item.name}, your Batta is missing for: ${missingDates}. Please submit.`)
                                  alert('Missing dates summary copied to clipboard!')
                                }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight flex items-center gap-1"
                              >
                                Copy Missing Summary
                              </button>
                            )}
                          </div>
                          <table className="w-full text-left">
                            <thead className="bg-slate-100/50 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                              <tr>
                                <th className="px-4 py-2 border-b">Date</th>
                                <th className="px-4 py-2 border-b">Status / Shift</th>
                                <th className="px-4 py-2 border-b">Particulars</th>
                                <th className="px-4 py-2 border-b">Approved By</th>
                                <th className="px-4 py-2 border-b text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[
                                ...item.entries.map((e: any) => ({ ...e, type: 'worked' })),
                                ...item.gaps.map((g: any) => ({ ...g, type: 'gap' }))
                              ].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry: any, i: number) => (
                                <tr key={i} className={cn(
                                  "text-xs hover:bg-slate-50",
                                  entry.type === 'gap' ? "bg-slate-50/30" : "text-slate-600"
                                )}>
                                  <td className="px-4 py-2 whitespace-nowrap font-medium">
                                    <span className={cn(
                                      new Date(entry.date).getDay() === 0 ? "text-red-400" : ""
                                    )}>
                                      {formatDate(entry.date)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    {entry.type === 'worked' ? (
                                      <div className="flex flex-col">
                                        {entry.category === 'Work' || !entry.category ? (() => {
                                          const battaRate = Number(entry.employee?.batta_amount || 0)
                                          const approvedAmount = entry.approved_amount !== undefined && entry.approved_amount !== null 
                                            ? Number(entry.approved_amount) 
                                            : battaRate
                                          const dutyValue = battaRate > 0 ? (approvedAmount / battaRate) : 1
                                          
                                          return (
                                            <span className={cn(
                                              "px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-tighter w-fit flex items-center gap-1",
                                              entry.day_night === 'Day' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                            )}>
                                              {entry.day_night}
                                              {dutyValue !== 1 && <span>({dutyValue})</span>}
                                            </span>
                                          )
                                        })() : (
                                          <span className={cn(
                                            "px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-tighter w-fit",
                                            entry.category === 'Leave' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
                                          )}>
                                            {entry.category === 'Leave' ? 'Leave' : 'No Work'}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-tighter w-fit",
                                        entry.status === 'sunday' ? "bg-slate-100 text-slate-500" : 
                                        entry.status === 'missing' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
                                      )}>
                                        {entry.label}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-slate-700">
                                    {entry.type === 'worked' ? entry.particulars : '-'}
                                  </td>
                                  <td className="px-4 py-2 text-slate-500 italic font-medium">
                                    {entry.type === 'worked' ? (entry.approver?.name || '-') : '-'}
                                  </td>
                                  <td className="px-4 py-2 text-right font-bold text-indigo-600">
                                    {entry.type === 'gap' ? '-' : (
                                      (entry.category === 'Work' || !entry.category) 
                                        ? `₹${entry.approved_amount || entry.employee?.batta_amount || 0}`
                                        : '₹0'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
