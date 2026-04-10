import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { BattaEntry, BattaStatus } from '../types'

export function useMyBattaEntries(status?: BattaStatus, filters?: { month?: number; year?: number; period?: string; search?: string }) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['batta-entries', user?.id, status, filters],
    queryFn: async () => {
      let query = supabase
        .from('batta_entries')
        .select(`
          *,
          employee:users!emp_id (name, emp_code, site, batta_amount, designation, name_ta, name_hi),
          approver:users!approved_by (name, name_ta, name_hi),
          manager:users!manager_id (name, name_ta, name_hi)
        `)
        .eq('emp_id', user?.id)
        .order('date', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      if (filters?.month && filters?.year) {
        const lastDay = new Date(filters.year, filters.month, 0).getDate()
        let startDay = 1
        let endDay = lastDay

        if (filters.period === '1') endDay = 15
        else if (filters.period === '2') startDay = 16

        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`
        const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
        
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error } = await query
      if (error) throw error
      
      let filteredData = data as BattaEntry[]
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        filteredData = filteredData.filter(d => 
          d.particulars.toLowerCase().includes(s)
        )
      }

      return filteredData
    },
    enabled: !!user?.id,
  })
}

export function usePendingTeamBatta(filters?: { month?: number; year?: number; period?: string; search?: string; date?: string }) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['pending-batta', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('batta_entries')
        .select(`
          *,
          employee:users!emp_id (name, emp_code, site, batta_amount, designation)
        `)
        .eq('manager_id', user?.id)
        .eq('status', 'pending')
        .order('date', { ascending: false })

      if (filters?.date) {
        query = query.eq('date', filters.date)
      } else if (filters?.month && filters?.year) {
        // Calculate the date range based on filters
        const lastDay = new Date(filters.year, filters.month, 0).getDate()
        let startDay = 1
        let endDay = lastDay

        if (filters.period === '1' || filters.period === '1-15') endDay = 15
        else if (filters.period === '2' || filters.period === '16-end') startDay = 16

        // Correct format for date string: YYYY-MM-DD
        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`
        const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
        
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error } = await query
      if (error) throw error

      let filteredData = data as BattaEntry[]
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        filteredData = filteredData.filter(d => 
          d.employee?.name.toLowerCase().includes(s) || 
          d.employee?.emp_code.toLowerCase().includes(s)
        )
      }

      return filteredData
    },
    enabled: !!user?.id && (user?.role === 'Manager' || user?.role === 'HR'),
  })
}

export function useRecentTeamDecisions(filters?: { month?: number; year?: number; period?: string; search?: string; date?: string }) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['recent-team-decisions', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('batta_entries')
        .select(`
          *,
          employee:users!emp_id (name, emp_code, site, batta_amount, designation)
        `)
        .eq('manager_id', user?.id)
        .neq('status', 'pending')
        .order('date', { ascending: false })

      if (filters?.date) {
        query = query.eq('date', filters.date)
      } else if (filters?.month && filters?.year) {
        // Calculate the date range based on filters
        const lastDay = new Date(filters.year, filters.month, 0).getDate()
        let startDay = 1
        let endDay = lastDay

        if (filters.period === '1' || filters.period === '1-15') endDay = 15
        else if (filters.period === '2' || filters.period === '16-end') startDay = 16

        // Correct format for date string: YYYY-MM-DD
        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`
        const endDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
        
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error } = await query
      if (error) throw error

      let filteredData = data as BattaEntry[]
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        filteredData = filteredData.filter(d => 
          d.employee?.name.toLowerCase().includes(s) || 
          d.employee?.emp_code.toLowerCase().includes(s)
        )
      }

      return filteredData
    },
    enabled: !!user?.id && (user?.role === 'Manager' || user?.role === 'HR'),
  })
}

export function useSubmitBatta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      date: string
      particulars: string
      managerId: string
      empId: string
      dayNight: 'Day' | 'Night'
      category?: 'Work' | 'Leave' | 'NoWork'
      time?: string
    }) => {
      const { error } = await supabase
        .from('batta_entries')
        .insert({
          emp_id: payload.empId,
          date: payload.date,
          particulars: payload.particulars,
          manager_id: payload.managerId,
          day_night: payload.dayNight,
          category: payload.category || 'Work',
          time: payload.time || null,
          status: 'pending',
        })

      if (error) {
        if (error.code === '23505') {
          throw new Error('duplicate_shift')
        }
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batta-entries'] })
    },
  })
}

export function useBattaEntry(id: string | null) {
  return useQuery({
    queryKey: ['batta-entry', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('batta_entries')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as BattaEntry
    },
    enabled: !!id,
  })
}

export function useUpdateBatta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id: string
      date: string
      particulars: string
      managerId: string
      dayNight: 'Day' | 'Night'
      category?: 'Work' | 'Leave' | 'NoWork'
      time?: string
    }) => {
      const { error } = await supabase
        .from('batta_entries')
        .update({
          date: payload.date,
          particulars: payload.particulars,
          manager_id: payload.managerId,
          day_night: payload.dayNight,
          category: payload.category || 'Work',
          time: payload.time || null,
        })
        .eq('id', payload.id)

      if (error) {
        if (error.code === '23505') {
          throw new Error('duplicate_shift')
        }
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batta-entries'] })
      qc.invalidateQueries({ queryKey: ['pending-batta'] })
    },
  })
}

export function useDeleteBatta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('batta_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batta-entries'] })
      qc.invalidateQueries({ queryKey: ['pending-batta'] })
    },
  })
}

export function useUpdateBattaStatus() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectReason, 
      approvedAmount 
    }: { 
      id: string; 
      status: 'approved' | 'rejected' | 'pending'
      rejectReason?: string
      approvedAmount?: number
    }) => {
      const payload: any = {
        status,
        approved_by: status === 'pending' ? null : user?.id,
        reject_reason: status === 'pending' ? null : (rejectReason || undefined),
        approved_amount: status === 'pending' ? null : (approvedAmount !== undefined ? approvedAmount : undefined)
      }

      const { error } = await supabase
        .from('batta_entries')
        .update(payload)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-batta'] })
      qc.invalidateQueries({ queryKey: ['recent-team-decisions'] })
    },
  })
}

export function useUpdateBattaManager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, managerId }: { id: string; managerId: string }) => {
      const { error } = await supabase
        .from('batta_entries')
        .update({ manager_id: managerId })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-pending-batta'] })
      qc.invalidateQueries({ queryKey: ['pending-batta'] })
    },
  })
}

export function useBattaStats(userId?: string) {
  const authUser = useAuthStore(s => s.user)
  const id = userId || authUser?.id

  return useQuery({
    queryKey: ['batta-stats', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batta_entries')
        .select('status, date, approved_amount')
        .eq('emp_id', id)

      if (error) throw error
      
      const stats = {
        pending: data.filter(d => d.status === 'pending').length,
        approved: data.filter(d => d.status === 'approved').length,
        thisMonth: data.filter(d => {
          const dDate = new Date(d.date)
          const now = new Date()
          return dDate.getMonth() === now.getMonth() && d.status === 'approved'
        }).reduce((sum, d) => {
          const battaRate = Number(authUser?.battaAmount || 0)
          const approvedAmount = d.approved_amount !== undefined && d.approved_amount !== null 
            ? Number(d.approved_amount) 
            : battaRate
          return sum + (battaRate > 0 ? (approvedAmount / battaRate) : 1)
        }, 0),
        thisMonthAmount: data.filter(d => {
          const dDate = new Date(d.date)
          const now = new Date()
          return dDate.getMonth() === now.getMonth() && d.status === 'approved'
        }).reduce((sum, d) => sum + Number((d.approved_amount !== undefined && d.approved_amount !== null) ? d.approved_amount : (authUser?.battaAmount || 0)), 0)
      }
      return stats
    },
    enabled: !!id,
  })
}

export function useTeamReport(month: number, year: number) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['team-report', user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batta_entries')
        .select(`
          *,
          employee:users!emp_id (name, emp_code, batta_amount)
        `)
        .eq('status', 'approved')
        .eq('approved_by', user?.id)

      if (error) throw error

      const filtered = data.filter(d => {
        const dDate = new Date(d.date)
        return (dDate.getMonth() + 1) === month && dDate.getFullYear() === year
      })

      return filtered as BattaEntry[]
    },
    enabled: !!user?.id && (user?.role === 'Manager' || user?.role === 'HR'),
  })
}

export function useGlobalBattaReport(month: number, year: number, period?: string, site?: string, date?: string) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['global-batta-report', month, year, period, site],
    queryFn: async () => {
      let query = supabase
        .from('batta_entries')
        .select(`
          *,
          employee:users!emp_id (name, emp_code, site, batta_amount, designation, catg_code),
          approver:users!approved_by (name)
        `)
        .eq('status', 'approved')

      if (date) {
        query = query.eq('date', date)
      }

      const { data, error } = await query
      if (error) throw error

      // Calculate the full date range for the period
      const lastDay = new Date(year, month, 0).getDate()
      let startDay = 1
      let endDay = lastDay

      if (period === '1') endDay = 15
      else if (period === '2') startDay = 16

      const today = new Date()
      // We'll generate dates for the entire selected period
      const periodDates: string[] = []
      for (let day = startDay; day <= endDay; day++) {
        // Create date in local time to avoid UTC shift issues
        const y = year
        const m = String(month).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        periodDates.push(`${y}-${m}-${d}`)
      }

      // Filter entries for the selected month/period
      let filtered = data.filter(d => {
        if (date) return d.date === date
        
        const dDate = new Date(d.date)
        const isMonthMatch = (dDate.getMonth() + 1) === month && dDate.getFullYear() === year
        if (!isMonthMatch) return false
        
        const day = dDate.getDate()
        return day >= startDay && day <= endDay
      })

      if (site) {
        filtered = filtered.filter(d => d.employee?.site === site)
      }

      // Group by employee
      const grouped = filtered.reduce((acc: any[], current) => {
        const existing = acc.find(item => item.emp_id === current.emp_id)
        const isWork = current.category === 'Work' || !current.category
        
        const battaRate = Number(current.employee?.batta_amount || 0)
        const approvedAmountValue = current.approved_amount !== undefined && current.approved_amount !== null 
          ? Number(current.approved_amount) 
          : battaRate
        const dutyValue = battaRate > 0 ? (approvedAmountValue / battaRate) : 1

        const amount = isWork ? approvedAmountValue : 0

        if (existing) {
          if (isWork) {
            if (current.day_night === 'Day') existing.dayCount += dutyValue
            else existing.nightCount += dutyValue
            existing.days += 1
          }
          existing.total += Number(amount)
          existing.entries.push(current)
        } else {
          acc.push({
            emp_id: current.emp_id,
            name: current.employee?.name || 'Unknown',
            emp_code: current.employee?.emp_code || '-',
            designation: current.employee?.designation || '-',
            site: current.employee?.site || '-',
            catg_code: current.employee?.catg_code || '999',
            dayCount: isWork ? (current.day_night === 'Day' ? dutyValue : 0) : 0,
            nightCount: isWork ? (current.day_night === 'Night' ? dutyValue : 0) : 0,
            days: isWork ? 1 : 0,
            total: Number(amount),
            entries: [current]
          })
        }
        return acc
      }, [])

      // Identify gaps for each employee in the result
      grouped.forEach(emp => {
        const workedDates = new Set(emp.entries.map((e: any) => e.date))
        const gaps: any[] = []

        periodDates.forEach(dateStr => {
          if (!workedDates.has(dateStr)) {
            // Use local date creation to check for Sunday
            const [y, m, d] = dateStr.split('-').map(Number)
            const dateObj = new Date(y, m - 1, d)
            const isSunday = dateObj.getDay() === 0
            const isFuture = dateObj > today

            if (isFuture) {
              gaps.push({ date: dateStr, status: 'upcoming', label: 'Upcoming' })
            } else if (isSunday) {
              gaps.push({ date: dateStr, status: 'sunday', label: 'SUNDAY' })
            } else {
              gaps.push({ date: dateStr, status: 'missing', label: 'MISSING' })
            }
          }
        })

        emp.gaps = gaps
        emp.missingCount = gaps.filter(g => g.status === 'missing').length
      })

      // Sort by catg_code then by name
      return grouped.sort((a, b) => {
        const catgA = a.catg_code || '999'
        const catgB = b.catg_code || '999'
        if (catgA !== catgB) {
          return catgA.localeCompare(catgB, undefined, { numeric: true })
        }
        return a.name.localeCompare(b.name)
      })
    },
    enabled: !!user?.id && (user?.role === 'HR' || user?.role === 'accounts'),
  })
}
export function useGlobalPendingBatta(filters: { month: number; year: number; period?: string; site?: string; search?: string; managerId?: string }) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['global-pending-batta', filters],
    queryFn: async () => {
      let query = supabase
        .from('batta_entries')
        .select(`
          *,
          employee:users!emp_id (name, emp_code, site, batta_amount, designation),
          manager:users!manager_id (name, emp_code, id)
        `)
        .neq('status', 'approved')
        .order('date', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      // Filter by month/year/period
      let filtered = data.filter(d => {
        const dDate = new Date(d.date)
        const isMonthMatch = (dDate.getMonth() + 1) === filters.month && dDate.getFullYear() === filters.year
        if (!isMonthMatch) return false
        
        if (filters.period) {
          const day = dDate.getDate()
          if (filters.period === '1') return day <= 15
          if (filters.period === '2') return day >= 16
        }
        return true
      })

      if (filters.site) {
        filtered = filtered.filter(d => d.employee?.site === filters.site)
      }

      if (filters.search) {
        const s = filters.search.toLowerCase()
        filtered = filtered.filter(d => 
          d.employee?.name.toLowerCase().includes(s) || 
          (d.employee?.emp_code || '').toLowerCase().includes(s) ||
          (d.manager?.name || '').toLowerCase().includes(s)
        )
      }

      if (filters.managerId) {
        filtered = filtered.filter(d => d.manager?.id === filters.managerId)
      }

      return filtered as (BattaEntry & { manager: { name: string; emp_code: string; id: string } })[]
    },
    enabled: !!user?.id && user?.role === 'HR',
  })
}
export function useMissingSubmissions(month: number, year: number, period?: string, site?: string, date?: string) {
  const user = useAuthStore(s => s.user)
  return useQuery({
    queryKey: ['missing-submissions', month, year, period, site, date],
    queryFn: async () => {
      // 1. Fetch all active employees with battaAmount > 0
      let usersQuery = supabase
        .from('users')
        .select('id, name, emp_code, site, batta_amount, designation, catg_code')
        .eq('active', true)
        .gt('batta_amount', 0)

      if (site) {
        usersQuery = usersQuery.eq('site', site)
      }

      const { data: allUsers, error: usersError } = await usersQuery
      if (usersError) throw usersError

      // 2. Fetch all batta entries for the range
      let entriesQuery = supabase
        .from('batta_entries')
        .select('emp_id, date')

      const lastDay = new Date(year, month, 0).getDate()
      let startDay = 1
      let endDay = lastDay

      if (period === '1') endDay = 15
      else if (period === '2') startDay = 16

      const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`
      const endDateString = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
      
      entriesQuery = entriesQuery.gte('date', startDate).lte('date', endDateString)
      
      if (date) {
        entriesQuery = entriesQuery.eq('date', date)
      }

      const { data: entries, error: entriesError } = await entriesQuery
      if (entriesError) throw entriesError

      // 3. Determine the dates to check
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const checkDates: string[] = []
      
      // If date is provided, only check that date. Otherwise check the whole period.
      const searchDayStart = date ? new Date(date).getDate() : startDay
      const searchDayEnd = date ? new Date(date).getDate() : Math.min(new Date().getDate(), endDay)

      for (let d = searchDayStart; d <= searchDayEnd; d++) {
        const dObj = new Date(year, month - 1, d)
        // Skip Sundays
        if (dObj.getDay() === 0) continue
        // Skip future dates
        if (dObj > today) continue
        
        checkDates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      }

      // 4. Find gaps
      const results = allUsers.map(u => {
        const userEntries = entries.filter(e => e.emp_id === u.id)
        const missingDates = checkDates.filter(d => !userEntries.some(e => e.date === d))
        
        return {
          ...u,
          missingDates,
          missingCount: missingDates.length
        }
      }).filter(r => r.missingCount > 0)

      // 5. Sort by catg_code and name
      return results.sort((a, b) => {
        const catgA = a.catg_code || '999'
        const catgB = b.catg_code || '999'
        if (catgA !== catgB) {
          return catgA.localeCompare(catgB, undefined, { numeric: true })
        }
        return a.name.localeCompare(b.name)
      })
    },
    enabled: !!user?.id && (user?.role === 'HR' || user?.role === 'accounts'),
  })
}
