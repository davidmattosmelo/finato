"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { DashboardHeader } from "@/components/dashboard-header"
import { BoletoWizard } from "@/components/boleto-wizard"
import { AdminPanel } from "@/components/admin-panel"
import { Loader2 } from "lucide-react"

type Page = "dashboard" | "admin"

function AppContent() {
  const { user, isLoading } = useAuth()
  const [page, setPage] = useState<Page>("dashboard")

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  if (page === "admin" && user.is_admin) {
    return (
      <>
        <DashboardHeader onNavigateAdmin={() => setPage("admin")} />
        <AdminPanel onBack={() => setPage("dashboard")} />
      </>
    )
  }

  return (
    <>
      <DashboardHeader onNavigateAdmin={() => setPage("admin")} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Emissor de Boletos</h2>
          <p className="text-sm text-muted-foreground">
            Preencha os dados e emita boletos em lote
          </p>
        </div>
        <BoletoWizard />
      </main>
    </>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
