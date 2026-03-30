import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { IndianRupee, Loader2, Mail, Lock } from 'lucide-react'
import { loginSchema, LoginFormValues } from '../../lib/schemas'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    try {
      const role = await login(data)
      toast.success('Login successful')
      
      const redirect = role === 'HR' ? '/hr' 
                     : role === 'Manager' ? '/manager' 
                     : '/employee'
      
      // Force a full page reload to ensure auth state from Supabase is fully caught by App.tsx
      window.location.href = redirect
    } catch (error: any) {
      if (error.message === 'inactive_account') {
        toast.error(t('auth.errorInactive'))
      } else if (error.name === 'AuthRetryableFetchError' || Object.keys(error).length === 0) {
        toast.error('Network Error: Could not connect to the server. Please try again.')
      } else {
        toast.error(error.message || t('messages.error'))
      }
      console.error("Login Error:", error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] mb-8 flex flex-col items-center">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-200 mb-4 animate-bounce">
          <IndianRupee className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{t('app.name')}</h1>
        <p className="text-slate-500 font-medium mt-1">{t('app.tagline')}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 w-full max-w-[400px] border border-slate-100">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail size={16} className="text-slate-400" />
              {t('auth.email')}
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@company.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
              disabled={loading}
            />
            {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              {t('auth.password')}
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
              disabled={loading}
            />
            {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t('auth.signIn')}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} E-Batta Management System
      </p>
    </div>
  )
}
