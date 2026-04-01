import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { useEmployees, useToggleEmployeeActive } from '../../hooks/useEmployees'
import { Edit2, ToggleLeft, ToggleRight, Plus, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import EmployeeForm from './EmployeeForm'
import BulkEmployeeUpload from '../../components/hr/BulkEmployeeUpload'

export default function EmployeeList() {
  const { t } = useTranslation()
  const { data: employees, isLoading } = useEmployees()
  const toggleActive = useToggleEmployeeActive()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [site, setSite] = useState('')

  const handleEdit = (emp: any) => {
    setSelectedEmployee(emp)
    setIsFormOpen(true)
  }

  const handleToggle = async (emp: any) => {
    try {
      await toggleActive.mutateAsync({ id: emp.id, active: !emp.active })
      toast.success(t('messages.saved'))
    } catch (error) {
      toast.error(t('messages.error'))
    }
  }

  const sites = Array.from(new Set(employees?.map(e => e.site).filter(Boolean))).sort()

  const filteredEmployees = employees?.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                         e.emp_code.toLowerCase().includes(search.toLowerCase())
    const matchesSite = !site || e.site === site
    return matchesSearch && matchesSite
  })

  const columns = [
    { 
      header: 'S.No', 
      accessor: (_: any, index: number) => index + 1,
      className: 'w-12 text-center font-bold text-slate-400'
    },
    { header: t('employee.code'), accessor: 'emp_code' as const },
    { header: t('employee.name'), accessor: 'name' as const },
    { header: t('employee.designation'), accessor: 'designation' as const },
    { header: 'Catg Code', accessor: 'catg_code' as const, sortable: true },
    { header: t('employee.site'), accessor: 'site' as const },
    { header: 'Role', accessor: 'role' as const },
    { 
      header: t('employee.active'), 
      accessor: (item: any) => <StatusBadge status={item.active ? 'active' : 'inactive'} /> 
    },
    {
      header: 'Actions',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleEdit(item)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleToggle(item)}
            className={item.active ? "text-emerald-600 p-1.5 hover:bg-emerald-50 rounded-lg" : "text-slate-400 p-1.5 hover:bg-slate-100 rounded-lg"}
          >
            {item.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('hr.employees')} 
        subtitle="Manage your workforce and their allowance settings."
        action={
          <div className="flex gap-3">
            <button 
              onClick={() => setIsBulkOpen(true)}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-all"
            >
              <Upload size={18} />
              {t('hr.bulkUpload')}
            </button>
            <button 
              onClick={() => { setSelectedEmployee(null); setIsFormOpen(true); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={18} />
              {t('hr.addEmployee')}
            </button>
          </div>
        }
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or code..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <select 
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Sites</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredEmployees} 
        loading={isLoading}
      />

      {isFormOpen && (
        <EmployeeForm 
          employee={selectedEmployee} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isBulkOpen && (
        <BulkEmployeeUpload 
          onClose={() => setIsBulkOpen(false)}
          onComplete={() => {
            setIsBulkOpen(false)
            // No need to manually refresh, react-query handles it
          }}
        />
      )}
    </div>
  )
}
