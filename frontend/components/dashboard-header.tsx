"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Building2, LogOut, Shield, Menu, X } from "lucide-react"
import { useState } from "react"

interface DashboardHeaderProps {
  onNavigateAdmin?: () => void
}

export function DashboardHeader({ onNavigateAdmin }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground leading-none">FINATO</h1>
            <p className="text-xs text-muted-foreground">Emissor de Boletos</p>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 md:flex">
          <span className="text-sm text-muted-foreground">
            Ola, <span className="font-medium text-foreground">{user?.username}</span>
          </span>
          {user?.is_admin && onNavigateAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateAdmin}
              className="border-border bg-transparent text-foreground hover:bg-secondary"
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 pt-3 md:hidden">
          <p className="mb-3 text-sm text-muted-foreground">
            Ola, <span className="font-medium text-foreground">{user?.username}</span>
          </p>
          <div className="flex flex-col gap-2">
            {user?.is_admin && onNavigateAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onNavigateAdmin()
                  setMobileOpen(false)
                }}
                className="justify-start border-border bg-transparent text-foreground"
              >
                <Shield className="mr-2 h-4 w-4" />
                Painel Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
