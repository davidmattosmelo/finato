"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { api } from "./api"

interface User {
  username: string
  is_active: boolean
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, fullName: string) => Promise<string>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token")
    if (savedToken) {
      setToken(savedToken)
      api.getMe()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          logout()
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [logout])

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password)
    localStorage.setItem("auth_token", data.access_token)
    setToken(data.access_token)

    const userData = await api.getMe()
    setUser(userData)
  }

  const register = async (username: string, password: string, fullName: string): Promise<string> => {
    const res = await api.register({ username, password, full_name: fullName })
    if (res.is_active) {
      return "Conta criada e ativada! Voce ja pode fazer login."
    }
    return "Cadastro solicitado! Aguarde aprovacao do administrador."
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
