import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export const battaSubmitSchema = z.object({
  date: z.string().refine(
    d => new Date(d) <= new Date(),
    'Cannot submit future dates'
  ),
  particulars: z.string()
    .min(5, 'Min 5 characters')
    .max(500, 'Max 500 characters'),
  managerId: z.string().min(1, 'Select a manager'),
  dayNight: z.enum(['Day', 'Night']),
  category: z.enum(['Work', 'Leave', 'NoWork']),
  time: z.string().optional(),
}).refine(data => {
  if (data.dayNight === 'Night' && (!data.time || data.time.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Time is required for Night shift",
  path: ["time"]
})

export const employeeSchema = z.object({
  empCode: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  nameTa: z.string().optional().or(z.literal('')),
  nameHi: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(8).optional(),
  designation: z.string().optional(),
  grade: z.string().optional(),
  catgCode: z.string().optional(),
  gradeCode: z.string().optional(),
  site: z.string().min(1, 'Site required'),
  battaAmount: z.number().min(0),
  managerId: z.string().optional().or(z.literal('')),
  role: z.enum(['HR', 'Manager', 'Employee', 'accounts']),
  active: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type BattaSubmitFormValues = z.infer<typeof battaSubmitSchema>
export type EmployeeFormValues = z.infer<typeof employeeSchema>
