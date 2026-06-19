import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.ok) {
          localStorage.removeItem('authToken')
          setLoading(false)
          return
        }

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
