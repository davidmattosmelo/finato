"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Building2, LogIn, UserPlus, KeyRound } from "lucide-react"

export function LoginForm() {
  const { login, register } = useAuth()
  const [view, setView] = useState<"login" | "forgot" | "reset">("login")

  // Login State
  const[loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const[loading, setLoading] = useState(false)

  // Register State
  const[regUsername, setRegUsername] = useState("")
  const [regFullName, setRegFullName] = useState("")
  const[regPassword, setRegPassword] = useState("")

  // Reset State
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUsername || !loginPassword) return toast.error("Preencha todos os campos")
    setLoading(true)
    try {
      await login(loginUsername, loginPassword)
      toast.success("Login realizado com sucesso!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regUsername || !regPassword || !regFullName) return toast.error("Preencha todos os campos")
    setLoading(true)
    try {
      const msg = await register(regUsername, regPassword, regFullName)
      toast.success(msg)
      setRegUsername(""); setRegFullName(""); setRegPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUsername) return toast.error("Digite seu usuário primeiro")
    setLoading(true)
    try {
      const res = await api.forgotPassword(loginUsername)
      toast.success(res.message)
      setView("reset")
    } catch (err) {
      toast.error("Erro ao solicitar recuperação")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetToken || !newPassword) return toast.error("Preencha o token e a nova senha")
    setLoading(true)
    try {
      await api.resetPassword(resetToken, newPassword)
      toast.success("Senha alterada com sucesso! Faça login.")
      setView("login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao redefinir senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="flex flex-col items-center gap-3 pb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">F I N A T O</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gerenciamento de boletos bancários</p>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {view === "login" && (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Usuário</Label>
                    <Input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="h-11 bg-secondary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <Label>Senha</Label>
                      <button type="button" onClick={() => setView("forgot")} className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="h-11 bg-secondary" />
                  </div>
                  <Button type="submit" disabled={loading} className="mt-2 h-11 w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Usuário</Label>
                    <Input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="h-11 bg-secondary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Nome Completo</Label>
                    <Input value={regFullName} onChange={(e) => setRegFullName(e.target.value)} className="h-11 bg-secondary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Senha</Label>
                    <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="h-11 bg-secondary" />
                  </div>
                  <Button type="submit" disabled={loading} className="mt-2 h-11 w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Solicitar Acesso
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 mt-4">
              <p className="text-sm text-muted-foreground text-center mb-2">Digite seu usuário para receber o token de recuperação.</p>
              <div className="flex flex-col gap-2">
                <Label>Usuário</Label>
                <Input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="h-11 bg-secondary" />
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Gerar Token
              </Button>
              <Button type="button" variant="ghost" onClick={() => setView("login")} className="w-full">Voltar</Button>
            </form>
          )}

          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4 mt-4">
              <p className="text-sm text-muted-foreground text-center mb-2">Verifique o terminal do backend para pegar o token gerado.</p>
              <div className="flex flex-col gap-2">
                <Label>Token de Recuperação</Label>
                <Input value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="h-11 bg-secondary" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 bg-secondary" />
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Redefinir Senha
              </Button>
              <Button type="button" variant="ghost" onClick={() => setView("login")} className="w-full">Cancelar</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}