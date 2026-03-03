"use client"

import { useEffect, useState, useCallback } from "react"
import { api, type AdminUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Clock, Loader2, Shield, Users, MoreVertical, Edit, Trash2, Ban, Check } from "lucide-react"

interface AdminPanelProps {
  onBack: () => void
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const[isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({ username: "", full_name: "", password: "", is_active: true, is_admin: false })
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.listUsers()
      setUsers(data)
    } catch {
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  },[])

  useEffect(() => { loadUsers() }, [loadUsers])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ username: "", full_name: "", password: "", is_active: true, is_admin: false })
    setIsModalOpen(true)
  }

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({ username: user.username, full_name: user.full_name, password: "", is_active: user.is_active, is_admin: user.is_admin })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.username || !formData.full_name) return toast.error("Preencha os campos obrigatórios")
    if (!editingUser && !formData.password) return toast.error("Senha é obrigatória para novos usuários")
    
    setSaving(true)
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          full_name: formData.full_name,
          is_active: formData.is_active,
          is_admin: formData.is_admin,
          ...(formData.password ? { password: formData.password } : {})
        })
        toast.success("Usuário atualizado!")
      } else {
        await api.createUser(formData)
        toast.success("Usuário criado!")
      }
      setIsModalOpen(false)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await api.updateUser(user.id, { is_active: !user.is_active })
      toast.success(`Usuário ${!user.is_active ? 'desbloqueado' : 'bloqueado'}!`)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na operação")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário permanentemente?")) return
    try {
      await api.deleteUser(id)
      toast.success("Usuário excluído!")
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir")
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">Painel Administrativo</h2>
            <p className="text-sm text-muted-foreground">Gerenciamento de usuários</p>
          </div>
        </div>
        <Button onClick={openCreateModal}>Novo Usuário</Button>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="flex flex-col">
              {users.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold">
                      {u.full_name?.charAt(0)?.toUpperCase() || u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.full_name || u.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.is_admin && <Badge className="bg-primary/20 text-primary border-0"><Shield className="mr-1 h-3 w-3" /> Admin</Badge>}
                    {u.is_active ? (
                      <Badge className="bg-success/20 text-success border-0">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-0">Bloqueado</Badge>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(u)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                          {u.is_active ? <><Ban className="mr-2 h-4 w-4" /> Bloquear</> : <><Check className="mr-2 h-4 w-4" /> Desbloquear</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(u.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Usuário (Login)</Label>
              <Input disabled={!!editingUser} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>{editingUser ? "Nova Senha (opcional)" : "Senha"}</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Usuário Ativo</Label>
                <p className="text-xs text-muted-foreground">Permite fazer login no sistema</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Administrador</Label>
                <p className="text-xs text-muted-foreground">Acesso total ao painel</p>
              </div>
              <Switch checked={formData.is_admin} onCheckedChange={(c) => setFormData({...formData, is_admin: c})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}