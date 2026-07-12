import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  getIdToken 
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import api from '../lib/api'
import { User } from '../types/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get fresh ID token
          const idToken = await getIdToken(firebaseUser, true)
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
          
          // Verify token with backend and get user profile
          const response = await api.post('/auth/verify-token')
          setUser(response.data)
        } catch (error) {
          console.error('Failed to verify token:', error)
          setUser(null)
        }
      } else {
        setUser(null)
        delete api.defaults.headers.common['Authorization']
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    try {
      await signInWithPopup(auth, provider)
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Google sign-in failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      delete api.defaults.headers.common['Authorization']
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      try {
        const idToken = await getIdToken(firebaseUser, true)
        api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
        const response = await api.post('/auth/verify-token')
        setUser(response.data)
      } catch (error) {
        console.error('Failed to refresh user:', error)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
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