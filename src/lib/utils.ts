import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, endOfMonth } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr = 'dd-MM-yyyy') {
  return format(new Date(date), formatStr)
}

export function fortnightRange(month: number, year: number, period: '1-15' | '16-end') {
  const baseDate = new Date(year, month - 1, 1)
  if (period === '1-15') {
    return {
      start: format(baseDate, 'yyyy-MM-01'),
      end: format(baseDate, 'yyyy-MM-15')
    }
  } else {
    const lastDay = endOfMonth(baseDate)
    return {
      start: format(baseDate, 'yyyy-MM-16'),
      end: format(lastDay, 'yyyy-MM-dd')
    }
  }
}

export function getMonthOptions() {
  return [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ]
}

export function getYearOptions() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: (currentYear - i).toString()
  }))
}
