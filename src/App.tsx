import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import HRDashboard from './pages/hr/HRDashboard'
import EmployeeList from './pages/hr/EmployeeList'
import HRReports from './pages/hr/HRReports'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import TeamReport from './pages/manager/TeamReport'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import SubmitBatta from './pages/employee/SubmitBatta'
import EmployeeInbox from './pages/employee/EmployeeInbox'
import ManagerInbox from './pages/manager/ManagerInbox'
import FortnightReport from './pages/employee/FortnightReport'
import ProfilePage from './pages/employee/ProfilePage'
import { useAuthStore } from './stores/authStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const user = useAuthStore(s => s.user)
  
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    const redirect = user.role === 'HR' ? '/hr' 
                   : user.role === 'Manager' ? '/manager' 
                   : '/employee'
    return <Navigate to={redirect} replace />
  }
  
  return <AppLayout>{children}</AppLayout>
}

function App() {
  const { isInitialized, setInitialized, setUser } = useAuthStore()

  useEffect(() => {
    let mounted = true
    
    // Listen for auth changes and initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: Auth event received:', event, !!session)
      
      try {
        if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null)
          if (mounted) setInitialized(true)
        } else if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          if (session) {
            const { data: profile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) console.warn('App: Profile fetch error', error)

            if (profile?.active) {
              if (mounted) {
                setUser({
                  id: profile.id,
                  name: profile.name,
                  role: profile.role,
                  empCode: profile.emp_code,
                  site: profile.site || '',
                  battaAmount: profile.batta_amount,
                  managerId: profile.manager_id,
                  email: profile.email || session.user.email,
                  designation: profile.designation || '',
                })
              }
            } else if (profile) {
              console.log('App: User inactive, signing out')
              await supabase.auth.signOut()
              if (mounted) setUser(null)
            }
          } else {
             if (mounted) setUser(null)
          }
          if (mounted) setInitialized(true)
        }
      } catch (e) {
        console.error('App: Error in auth state change', e)
        if (mounted) {
          setUser(null)
          setInitialized(true)
        }
      }
    })

    // Failsafe in case INITIAL_SESSION never fires (rare, but good to have)
    const failsafe = setTimeout(() => {
      if (mounted) setInitialized(true)
    }, 4000)

    return () => {
      mounted = false
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading E-Batta...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* HR ROUTES */}
        <Route path="/hr" element={<PrivateRoute roles={['HR']}><HRDashboard /></PrivateRoute>} />
        <Route path="/hr/employees" element={<PrivateRoute roles={['HR']}><EmployeeList /></PrivateRoute>} />
        <Route path="/hr/reports" element={<PrivateRoute roles={['HR']}><HRReports /></PrivateRoute>} />
        
        {/* MANAGER ROUTES */}
        <Route path="/manager" element={<PrivateRoute roles={['Manager']}><ManagerDashboard /></PrivateRoute>} />
        <Route path="/manager/team" element={<PrivateRoute roles={['Manager', 'HR']}><TeamReport /></PrivateRoute>} />
        <Route path="/manager/inbox" element={<PrivateRoute roles={['Manager', 'HR']}><ManagerInbox /></PrivateRoute>} />
        
        {/* SHARED MANAGER/EMPLOYEE ROUTES */}
        <Route path="/submit-batta" element={
          <PrivateRoute roles={['Employee', 'Manager', 'HR']}><SubmitBatta /></PrivateRoute>
        } />
        <Route path="/inbox" element={
          <PrivateRoute roles={['Employee', 'Manager', 'HR']}><EmployeeInbox /></PrivateRoute>
        } />
        <Route path="/manager/submit" element={<Navigate to="/submit-batta" replace />} />
        
        {/* EMPLOYEE ROUTES */}
        <Route path="/employee" element={<PrivateRoute roles={['Employee']}><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employee/report" element={<PrivateRoute roles={['Employee', 'Manager', 'HR']}><FortnightReport /></PrivateRoute>} />
        
        {/* COMMON ROUTES */}
        <Route path="/profile" element={<PrivateRoute roles={['HR', 'Manager', 'Employee']}><ProfilePage /></PrivateRoute>} />
        
        {/* REDIRECTS */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}

export default App
