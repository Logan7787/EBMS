import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { useTeamReport } from '../../hooks/useBatta'
import { getMonthOptions, getYearOptions } from '../../lib/utils'
import { Download, Users } from 'lucide-react'

export default function TeamReport() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString()
  })

  const { data: entries, isLoading } = useTeamReport(Number(filters.month), Number(filters.year))

  // Group entries by employee
  const reportData = entries?.reduce((acc: any[], current) => {
    const existing = acc.find(item => item.emp_code === current.employee?.emp_code);
    const battaRate = Number(current.employee?.batta_amount || 0);
    const approvedAmount = current.approved_amount !== undefined && current.approved_amount !== null 
      ? Number(current.approved_amount) 
      : battaRate;
    const dutyValue = battaRate > 0 ? (approvedAmount / battaRate) : 1;

    if (existing) {
      existing.days += dutyValue;
      existing.total += Number(approvedAmount);
    } else {
      acc.push({
        name: current.employee?.name || 'Unknown',
        emp_code: current.employee?.emp_code || '-',
        days: dutyValue,
        total: Number(approvedAmount)
      });
    }
    return acc;
  }, []) || []

  const columns = [
    { header: t('employee.name'), accessor: 'name' as const },
    { header: t('employee.code'), accessor: 'emp_code' as const },
    { header: t('batta.days'), accessor: (item: any) => +item.days.toFixed(1) },
    { 
      header: t('batta.totalAmount'), 
      accessor: (item: any) => `₹${item.total}` 
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('manager.myTeam')} 
        subtitle="Monthly summary of field allowances for your direct reports."
        action={
          <button className="bg-white border text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50">
            <Download size={18} />
            {t('actions.download')}
          </button>
        }
      />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500 mr-2">
          <Users size={20} />
          <span className="text-sm font-bold uppercase tracking-tight">Period Filter</span>
        </div>
        
        <div className="w-40">
          <select 
            value={filters.month}
            onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}
            className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50"
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
            className="w-full px-4 py-2 border rounded-xl text-sm bg-slate-50"
          >
            {getYearOptions().map(y => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </div>

        <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">
          Update View
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={reportData}
        loading={isLoading}
      />
    </div>
  )
}
