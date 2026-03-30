import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { battaSubmitSchema, BattaSubmitFormValues } from '../../lib/schemas'
import { useSubmitBatta } from '../../hooks/useBatta'
import { useManagers } from '../../hooks/useEmployees'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'sonner'
import { PageHeader } from '../../components/shared/PageHeader'
import { Send, Calendar, MessageSquare, UserCheck, Loader2, SunMoon, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function SubmitBatta() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data: managers } = useManagers()
  const submitBatta = useSubmitBatta()

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<BattaSubmitFormValues>({
    resolver: zodResolver(battaSubmitSchema),
    defaultValues: {
      managerId: user?.managerId || '',
      date: new Date().toISOString().split('T')[0],
      dayNight: 'Day',
      category: 'Work',
      time: ''
    }
  })

  const category = watch('category')

  // Auto-fill particulars and handle shift interaction when category changes
  useEffect(() => {
    if (category === 'Leave') {
      setValue('particulars', 'Leave')
    } else if (category === 'NoWork') {
      setValue('particulars', 'Rest / No Work')
    } else if (category === 'Work' && (watch('particulars') === 'Leave' || watch('particulars') === 'Rest / No Work')) {
      setValue('particulars', '')
    }
  }, [category, setValue, watch])

  const onSubmit = async (data: BattaSubmitFormValues) => {
    try {
      if (!user?.id) return
      await submitBatta.mutateAsync({
        ...data,
        empId: user.id
      })
      toast.success(t('batta.submitted'))
      navigate('/inbox')
    } catch (error: any) {
      if (error.message === 'duplicate_shift') {
        toast.error(`You have already submitted a ${data.dayNight} shift entry for this date!`)
      } else if (error.message === 'duplicate_date') {
        toast.error(t('batta.duplicateDate'))
      } else {
        toast.error(t('messages.error'))
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader 
        title={t('nav.submit')} 
        subtitle="Record your fieldwork details for allowance processing."
      />

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-4 flex items-center gap-3">
          <Send className="text-white/80" size={20} />
          <h3 className="text-white font-bold">{t('batta.submit')}</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                {t('batta.date')}
              </label>
              <input 
                {...register('date')}
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border transition-all text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
                  errors.date ? "border-red-500" : "border-slate-200 focus:border-indigo-500"
                )}
              />
              {errors.date && <p className="text-red-500 text-xs font-medium">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <UserCheck size={16} className="text-indigo-500" />
                Work Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Work', 'Leave', 'NoWork'].map((type) => (
                  <label 
                    key={type}
                    className={cn(
                      "flex items-center justify-center py-3 border rounded-xl cursor-pointer transition-all text-xs font-bold",
                      category === type 
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm" 
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <input type="radio" value={type} {...register('category')} className="hidden" />
                    {type === 'NoWork' ? 'No Work' : type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={cn("space-y-4 transition-all duration-300", category !== 'Work' ? "opacity-40 grayscale pointer-events-none" : "opacity-100")}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <SunMoon size={16} className="text-indigo-500" />
                Shift
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={cn(
                  "flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all",
                  watch('dayNight') === 'Day' ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}>
                  <input type="radio" value="Day" {...register('dayNight')} className="hidden" />
                  Day
                </label>
                <label className={cn(
                  "flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all",
                  watch('dayNight') === 'Night' ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}>
                  <input type="radio" value="Night" {...register('dayNight')} className="hidden" />
                  Night
                </label>
              </div>
            </div>

            {watch('dayNight') === 'Night' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" />
                  Time
                </label>
                <input 
                  {...register('time')}
                  type="time"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border transition-all text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10",
                    errors.time ? "border-red-500" : "border-slate-200 focus:border-indigo-500"
                  )}
                />
                {errors.time && <p className="text-red-500 text-xs font-medium">{errors.time.message}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" />
              {t('batta.particulars')}
            </label>
            <textarea 
              {...register('particulars')}
              rows={category === 'Work' ? 4 : 2}
              placeholder="Describe your fieldwork..."
              readOnly={category !== 'Work'}
              className={cn(
                "w-full px-4 py-3 rounded-xl border transition-all text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none",
                errors.particulars ? "border-red-500" : "border-slate-200 focus:border-indigo-500",
                category !== 'Work' ? "bg-slate-50 text-slate-500 italic" : ""
              )}
            />
            {errors.particulars && <p className="text-red-500 text-xs font-medium">{errors.particulars.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <UserCheck size={16} className="text-indigo-500" />
              {t('batta.manager')}
            </label>
            <select 
              {...register('managerId')}
              className={cn(
                "w-full px-4 py-3 rounded-xl border transition-all text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white",
                errors.managerId ? "border-red-500" : "border-slate-200 focus:border-indigo-500"
              )}
            >
              <option value="">{t('actions.add')}...</option>
              {managers?.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {errors.managerId && <p className="text-red-500 text-xs font-medium">{errors.managerId.message}</p>}
          </div>

          <div className="pt-4 border-t border-slate-50 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> {t('batta.submit')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
