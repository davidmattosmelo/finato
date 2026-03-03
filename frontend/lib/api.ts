const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface LoginResponse {
  access_token: string
  token_type: string
}

interface UserResponse {
  username: string
  is_active: boolean
  is_admin: boolean
}

export interface Pagador {
  cpfCnpj: string
  tipoPessoa: 'FISICA' | 'JURIDICA'
  nome: string
  endereco: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  email: string
  ddd: string
  telefone: string
}

export interface BoletoPayload {
  seuNumero: string
  valorNominal: number
  dataVencimento: string
  numDiasAgenda?: number
  pagador: Pagador
  mensagem?: { linha1?: string }
  multa?: { codigo: string, taxa: number, data?: string }
  mora?: { codigo: string, taxa: number, data?: string }
}

export interface BoletoResult {
  parcela: number
  vencimento: string
  status: "sucesso" | "falha" | "erro"
  detalhe: string
}

export interface AdminUser {
  id: number
  username: string
  full_name: string
  is_active: boolean
  is_admin: boolean
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  }

  private getHeaders(auth = true): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (auth) {
      const token = this.getToken()
      if (token) headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)
    const res = await fetch(`${BACKEND_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao fazer login")
    return res.json()
  }

  async register(data: any): Promise<UserResponse> {
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao registrar")
    return res.json()
  }

  async getMe(): Promise<UserResponse> {
    const res = await fetch(`${BACKEND_URL}/users/me`, { headers: this.getHeaders() })
    if (!res.ok) throw new Error("Sessão expirada")
    return res.json()
  }

  async forgotPassword(username: string) {
    const res = await fetch(`${BACKEND_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
    return res.json()
  }

  async resetPassword(token: string, new_password: string) {
    const res = await fetch(`${BACKEND_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password }),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao redefinir senha")
    return res.json()
  }

  // --- ADMIN ROUTES ---
  async listUsers(): Promise<AdminUser[]> {
    const res = await fetch(`${BACKEND_URL}/admin/users`, { headers: this.getHeaders() })
    if (!res.ok) throw new Error("Erro ao listar usuários")
    return res.json()
  }

  async createUser(data: any): Promise<AdminUser> {
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao criar usuário")
    return res.json()
  }

  async updateUser(userId: number, data: any): Promise<AdminUser> {
    const res = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao atualizar usuário")
    return res.json()
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const res = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao deletar usuário")
    return res.json()
  }

  // --- BOLETOS ROUTES ---
  async emitirBoleto(data: BoletoPayload) {
    const res = await fetch(`${BACKEND_URL}/emitir-boleto`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).detail || "Erro ao emitir boleto")
    return res.json()
  }

  async buscarPagador(cpfCnpj: string): Promise<Pagador> {
    const res = await fetch(`${BACKEND_URL}/pagador/${cpfCnpj}`, { headers: this.getHeaders() })
    if (!res.ok) throw new Error((await res.json()).detail || "Pagador não encontrado")
    return res.json()
  }
}

export const api = new ApiClient()