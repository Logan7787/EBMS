import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole } from '../types'

interface UserState {
  id: string
  name: string
  role: UserRole
  empCode: string
  site: string
  battaAmount: number
  managerId?: string
  email?: string
  designation?: string
}

interface AuthStore {
  user: UserState | null
  isInitialized: boolean
  setUser: (user: UserState | null) => void
  setInitialized: (val: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setInitialized: (val) => set({ isInitialized: val }),
    }),
    { name: 'ebatta-auth' }
  )
)
