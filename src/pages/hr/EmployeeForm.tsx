import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { employeeSchema, EmployeeFormValues } from '../../lib/schemas'
import { useSaveEmployee, useManagers } from '../../hooks/useEmployees'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'

interface EmployeeFormProps {
  employee?: any
  onClose: () => void
}

export default function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const { t } = useTranslation()
  const saveEmployee = useSaveEmployee()
  const { data: managers } = useManagers()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      empCode: employee.emp_code,
      name: employee.name,
      email: employee.email || '',
      designation: employee.designation || '',
      grade: employee.grade || '',
      catgCode: employee.catg_code || '',
      gradeCode: employee.grade_code || '',
      site: employee.site || '',
      battaAmount: employee.batta_amount || 0,
      role: employee.role,
      managerId: employee.manager_id || '',
      active: !!employee.active,
    } : {
      empCode: '',
      name: '',
      email: '',
      site: '',
      battaAmount: 0,
      role: 'Employee',
      active: true,
      managerId: '',
    }
  })

  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    try {
      await saveEmployee.mutateAsync({ ...data, id: employee?.id })
      toast.success(t('messages.saved'))
      onClose()
    } catch (error: any) {
      toast.error(error.message || t('messages.error'))
      console.error(error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {employee ? t('hr.editEmployee') : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('employee.code')}</label>
              <input {...register('empCode')} className="w-full px-4 py-2 border rounded-lg text-sm" />
              {errors.empCode && <p className="text-red-500 text-xs">{errors.empCode.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('employee.name')}</label>
              <input {...register('name')} className="w-full px-4 py-2 border rounded-lg text-sm" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('auth.email')}</label>
              <input {...register('email')} type="email" disabled={!!employee} className="w-full px-4 py-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            {!employee && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">{t('auth.password')}</label>
                <input {...register('password')} type="password" placeholder="Min 6 characters" className="w-full px-4 py-2 border rounded-lg text-sm" />
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('employee.site')}</label>
              <input {...register('site')} className="w-full px-4 py-2 border rounded-lg text-sm" />
              {errors.site && <p className="text-red-500 text-xs">{errors.site.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('employee.designation')}</label>
              <input {...register('designation')} className="w-full px-4 py-2 border rounded-lg text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t('employee.rate')}</label>
              <input {...register('battaAmount', { valueAsNumber: true })} type="number" className="w-full px-4 py-2 border rounded-lg text-sm" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Grade</label>
              <input {...register('grade')} className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50" placeholder="e.g., G1" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Category Code</label>
              <input {...register('catgCode')} className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50" placeholder="e.g., CAT-A" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Grade Code</label>
              <input {...register('gradeCode')} className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-50" placeholder="e.g., GC-01" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <select {...register('role')} className="w-full px-4 py-2 border rounded-lg text-sm bg-white">
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Reporting Manager</label>
              <select {...register('managerId')} className="w-full px-4 py-2 border rounded-lg text-sm bg-white">
                <option value="">Select Manager</option>
                {managers?.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : t('actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
