import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseCreator } from '../lib/supabase'
import { User } from '../types'
import { EmployeeFormValues } from '../lib/schemas'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as User[]
    },
  })
}

export function useManagers() {
  return useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('role', ['Manager', 'HR'])
        .eq('active', true)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useSaveEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: EmployeeFormValues & { id?: string }) => {
      const { id, password, ...rest } = payload
      
      const userData = {
        emp_code: rest.empCode,
        name: rest.name,
        role: rest.role,
        designation: rest.designation,
        grade: rest.grade,
        catg_code: rest.catgCode,
        grade_code: rest.gradeCode,
        site: rest.site,
        batta_amount: rest.battaAmount,
        manager_id: rest.managerId || null,
        active: rest.active,
      }

      if (id) {
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', id)
        if (error) throw error
      } else {
        // HR creates a new user from the UI
        if (!rest.email) {
          throw new Error('Email is required to create a new employee.')
        }
        if (!password || password.length < 6) {
          throw new Error('A strong password is required for new employees (min 6 characters).')
        }

        // 1. Create the Auth user using the secondary client (prevents logging out the HR user)
        const { data: authData, error: authError } = await supabaseCreator.auth.signUp({
          email: rest.email,
          password: password,
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('User creation failed in Auth.')

        // 2. The PostgreSQL trigger (handle_new_user) instantly creates the public.users row.
        // We now update that newly created row with the specific details provided in the form.
        const { error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('id', authData.user.id)

        if (updateError) {
          console.error("Failed to sync employee details, but auth user was created.", updateError)
          throw new Error('User created, but failed to save profile details. Please try editing the user.')
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useToggleEmployeeActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
