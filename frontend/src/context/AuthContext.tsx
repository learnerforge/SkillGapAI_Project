import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthState {
  loggedIn: boolean
  username: string | null
  userId: string | null
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<string | null>
  register: (username: string, email: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loggedIn: false,
    username: null,
    userId: null,
  })

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) {
        setState({ loggedIn: true, username, userId: String(data.user?.id ?? '') })
        return null
      }
      return data.message || 'Invalid credentials'
    } catch {
      return 'Backend offline. Run app.py first.'
    }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()
      if (data.success) return null
      return data.message || 'Registration failed'
    } catch {
      return 'Backend offline. Run app.py first.'
    }
  }, [])

  const logout = useCallback(() => {
    setState({ loggedIn: false, username: null, userId: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
