export type UserRole = 'HR' | 'Manager' | 'Employee'

export interface User {
  id: string
  emp_code: string
  name: string
  role: UserRole
  designation?: string
  grade?: string
  catg_code?: string
  grade_code?: string
  site?: string
  batta_amount: number
  manager_id?: string
  active: boolean
  created_at: string
}

export type BattaStatus = 'pending' | 'approved' | 'rejected'

export interface BattaEntry {
  id: string
  emp_id: string
  date: string
  particulars: string
  manager_id: string
  status: BattaStatus
  approved_by?: string
  created_at: string
  day_night: 'Day' | 'Night'
  category: 'Work' | 'Leave' | 'NoWork'
  time?: string
  reject_reason?: string
  approved_amount?: number
  final_state?: string
  final_step?: string
  // Joined data
  employee?: {
    name: string
    emp_code: string
    site: string
    batta_amount: number
    designation?: string
  }
}

export interface BattaReportRow {
  employee: string
  emp_code: string
  site: string
  days: number
  amount: number
}
