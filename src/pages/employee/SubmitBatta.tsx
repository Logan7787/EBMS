import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { battaSubmitSchema, BattaSubmitFormValues } from '../../lib/schemas'
import { useSubmitBatta, useBattaEntry, useUpdateBatta } from '../../hooks/useBatta'
import { useManagers } from '../../hooks/useEmployees'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'sonner'
import { PageHeader } from '../../components/shared/PageHeader'
import { Send, Calendar, MessageSquare, UserCheck, Loader2, SunMoon, Clock, Mic, MicOff, Save } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getDisplayName } from '../../lib/userUtils'

export default function SubmitBatta() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const user = useAuthStore(s => s.user)
  const { data: managers } = useManagers()
  const submitBatta = useSubmitBatta()
  const updateBatta = useUpdateBatta()
  const { data: existingEntry, isLoading: isLoadingEntry } = useBattaEntry(editId)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } = useForm<BattaSubmitFormValues>({
    resolver: zodResolver(battaSubmitSchema),
    defaultValues: {
      managerId: user?.managerId || '',
      date: new Date().toISOString().split('T')[0],
      dayNight: 'Day',
      category: 'Work',
      time: ''
    }
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (existingEntry) {
      reset({
        date: existingEntry.date,
        particulars: existingEntry.particulars,
        managerId: existingEntry.manager_id,
        dayNight: existingEntry.day_night as 'Day' | 'Night',
        category: (existingEntry.category || 'Work') as 'Work' | 'Leave' | 'NoWork',
        time: existingEntry.time || ''
      })
    }
  }, [existingEntry, reset])

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = typeof window !== 'undefined' 
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) 
      : null

    if (!SpeechRecognition) {
      toast.error('Voice-to-Text is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true // Show results as they come
    recognition.lang = 'en-IN' // Explicitly set for better accuracy in India

    recognition.onstart = () => {
      setIsListening(true)
      toast.info('Listening... Please speak now.')
    }
    
    recognition.onend = () => setIsListening(false)
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied!')
      } else if (event.error === 'no-speech') {
        toast.info('No speech heard. Trying to listen again...')
      }
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript) {
        const currentText = watch('particulars') || ''
        const spacer = currentText && !currentText.endsWith(' ') ? ' ' : ''
        setValue('particulars', currentText + spacer + finalTranscript.trim(), { shouldDirty: true })
        console.log('Final speech captured:', finalTranscript)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

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
      
      if (editId) {
        await updateBatta.mutateAsync({
          id: editId,
          ...data
        })
        toast.success("Batta entry updated successfully")
      } else {
        await submitBatta.mutateAsync({
          ...data,
          empId: user.id
        })
        toast.success(t('batta.submitted'))
      }
      
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
        title={editId ? "Edit Batta" : t('nav.submit')} 
        subtitle={editId ? "Correct your fieldwork details." : "Record your fieldwork details for allowance processing."}
      />

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-4 flex items-center gap-3">
          {editId ? <Save className="text-white/80" size={20} /> : <Send className="text-white/80" size={20} />}
          <h3 className="text-white font-bold">{editId ? "Update Entry" : t('batta.submit')}</h3>
        </div>

        {isLoadingEntry ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 font-medium">Loading entry details...</p>
          </div>
        ) : (
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-500" />
                {t('batta.particulars')}
              </label>
              
              {category === 'Work' && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                    isListening 
                      ? "bg-red-50 text-red-600 animate-pulse border border-red-200" 
                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
                  )}
                >
                  {isListening ? (
                    <><MicOff size={12} /> STOP VOICE</>
                  ) : (
                    <><Mic size={12} /> TYPE BY VOICE</>
                  )}
                </button>
              )}
            </div>
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
              {managers?.filter((m: any) => m.id !== user?.id).map((m: any) => (
                <option key={m.id} value={m.id}>{getDisplayName(m, i18n.language)}</option>
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
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {editId ? <Save size={18} /> : <Send size={18} />} 
                  {editId ? "Update Entry" : t('batta.submit')}
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
