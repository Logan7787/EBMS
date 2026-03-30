import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { LoginFormValues } from '../lib/schemas'

export function useAuth() {
  const { user, setUser } = useAuthStore()

  async function login({ email, password }: LoginFormValues) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw profileError
    
    if (!profile?.active) {
      await supabase.auth.signOut()
      throw new Error('inactive_account')
    }

    setUser({
      id: profile.id,
      name: profile.name,
      role: profile.role,
      empCode: profile.emp_code,
      site: profile.site || '',
      battaAmount: profile.batta_amount,
      managerId: profile.manager_id,
      email: profile.email || data.user.email,
      designation: profile.designation || '',
    })
    
    return profile.role
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error("SignOut error:", e)
    } finally {
      sessionStorage.removeItem('pending_notification_shown')
      setUser(null)
    }
  }

  return { user, login, logout }
}
