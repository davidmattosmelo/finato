"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  User,
  FileText,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { api, type BoletoPayload, type BoletoResult } from "@/lib/api"

interface Lote {
  lote: string
  quadra: string
}

interface ClienteData {
  cpfCnpj: string
  nome: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  email: string
  telefone: string
}

interface CarneData {
  valorTotal: number
  contrato: string
  totalParcelas: number
  parcelaInicial: number
  parcelaFinal: number
  empreendimento: string
  estado: string
  cidadeEmissao: string
  dataBase: string
  lotes: Lote[]
}

const STEPS = [
  { id: 1, label: "Cliente", icon: User },
  { id: 2, label: "Dados do Boleto", icon: FileText },
  { id: 3, label: "Disparo", icon: Rocket },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-4">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const isActive = currentStep === step.id
        const isDone = currentStep > step.id

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ... (mantenha os imports e interfaces existentes no topo do arquivo) ...
import { Search } from "lucide-react" // Adicione este import lá em cima

function StepCliente({
  data,
  onChange,
}: {
  data: ClienteData
  onChange: (data: ClienteData) => void
}) {
  const [buscando, setBuscar] = useState(false)

  const update = (field: keyof ClienteData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const handleBuscarInter = async () => {
    if (!data.cpfCnpj || data.cpfCnpj.length < 11) {
      toast.error("Digite um CPF/CNPJ válido para buscar")
      return
    }
    setBuscar(true)
    try {
      const pagador = await api.buscarPagador(data.cpfCnpj)
      onChange({
        ...data,
        nome: pagador.nome || data.nome,
        cep: pagador.cep || data.cep,
        endereco: pagador.endereco || data.endereco,
        numero: pagador.numero || data.numero,
        bairro: pagador.bairro || data.bairro,
        cidade: pagador.cidade || data.cidade,
        uf: pagador.uf || data.uf,
        email: pagador.email || data.email,
        telefone: pagador.ddd && pagador.telefone ? `${pagador.ddd}${pagador.telefone}` : data.telefone,
      })
      toast.success("Dados preenchidos com sucesso pelo histórico do Inter!")
    } catch (err) {
      toast.error("Pagador não encontrado no histórico do Inter")
    } finally {
      setBuscar(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">CPF/CNPJ</Label>
          <div className="flex gap-2">
            <Input
              placeholder="000.000.000-00"
              value={data.cpfCnpj}
              onChange={(e) => update("cpfCnpj", e.target.value)}
              className="h-11 bg-secondary border-border text-foreground"
            />
            <Button 
              type="button" 
              variant="outline" 
              className="h-11 px-3" 
              onClick={handleBuscarInter}
              disabled={buscando}
              title="Buscar dados no histórico do Inter"
            >
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Nome Completo</Label>
          <Input
            placeholder="Nome do pagador"
            value={data.nome}
            onChange={(e) => update("nome", e.target.value)}
            className="h-11 bg-secondary border-border text-foreground"
          />
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Endereço e Contato</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">CEP</Label>
            <Input value={data.cep} onChange={(e) => update("cep", e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-1 lg:col-span-2">
            <Label className="text-muted-foreground">Rua</Label>
            <Input value={data.endereco} onChange={(e) => update("endereco", e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Número</Label>
            <Input value={data.numero} onChange={(e) => update("numero", e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Bairro</Label>
            <Input value={data.bairro} onChange={(e) => update("bairro", e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Cidade</Label>
            <Input value={data.cidade} onChange={(e) => update("cidade", e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">UF</Label>
            <Input maxLength={2} value={data.uf} onChange={(e) => update("uf", e.target.value.toUpperCase())} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Email</Label>
            <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} className="h-11 bg-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Telefone</Label>
            <Input value={data.telefone} onChange={(e) => update("telefone", e.target.value)} className="h-11 bg-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ... (mantenha o restante do arquivo boleto-wizard.tsx intacto) ...

function StepDados({
  data,
  onChange,
}: {
  data: CarneData
  onChange: (data: CarneData) => void
}) {
  const [tmpLote, setTmpLote] = useState("")
  const [tmpQuadra, setTmpQuadra] = useState("")

  const update = (field: keyof CarneData, value: unknown) => {
    onChange({ ...data, [field]: value })
  }

  const addLote = () => {
    if (tmpLote && tmpQuadra) {
      onChange({ ...data, lotes: [...data.lotes, { lote: tmpLote, quadra: tmpQuadra }] })
      setTmpLote("")
      setTmpQuadra("")
    }
  }

  const removeLote = (index: number) => {
    onChange({ ...data, lotes: data.lotes.filter((_, i) => i !== index) })
  }

  const qtd = data.parcelaFinal >= data.parcelaInicial ? data.parcelaFinal - data.parcelaInicial + 1 : 0
  const valorUnitario = qtd > 0 ? data.valorTotal / qtd : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Financial Data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Valor Total (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={data.valorTotal || ""}
            onChange={(e) => update("valorTotal", Number.parseFloat(e.target.value) || 0)}
            className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">N. Contrato</Label>
          <Input
            placeholder="Numero do contrato"
            value={data.contrato}
            onChange={(e) => update("contrato", e.target.value)}
            className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Total de Parcelas</Label>
          <Input
            type="number"
            min="1"
            value={data.totalParcelas}
            onChange={(e) => update("totalParcelas", Number.parseInt(e.target.value) || 1)}
            className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Parcelas range */}
      <div>
        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Intervalo de Emissao</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Parcela Inicial</Label>
            <Input
              type="number"
              min="1"
              value={data.parcelaInicial}
              onChange={(e) => update("parcelaInicial", Number.parseInt(e.target.value) || 1)}
              className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Parcela Final</Label>
            <Input
              type="number"
              min="1"
              value={data.parcelaFinal}
              onChange={(e) => update("parcelaFinal", Number.parseInt(e.target.value) || 1)}
              className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        {qtd > 0 && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm text-primary font-medium">
              {qtd} boleto{qtd > 1 ? "s" : ""} de R$ {valorUnitario.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Lotes */}
      <div>
        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Lotes e Quadras</h4>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label className="text-muted-foreground">Lote</Label>
              <Input
                placeholder="Ex: 01"
                value={tmpLote}
                onChange={(e) => setTmpLote(e.target.value)}
                className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label className="text-muted-foreground">Quadra</Label>
              <Input
                placeholder="Ex: 05"
                value={tmpQuadra}
                onChange={(e) => setTmpQuadra(e.target.value)}
                className="h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addLote}
            className="h-11 border-border bg-transparent text-foreground hover:bg-secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {data.lotes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.lotes.map((l, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="gap-1 bg-secondary text-foreground border border-border px-3 py-1"
              >
                L{l.lote}Q{l.quadra}
                <button
                  type="button"
                  onClick={() => removeLote(i)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  aria-label={`Remover lote ${l.lote} quadra ${l.quadra}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StepDisparo({
  carneData,
  onChange,
}: {
  carneData: CarneData
  onChange: (data: CarneData) => void
}) {
  const update = (field: keyof CarneData, value: unknown) => {
    onChange({ ...carneData, [field]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Empreendimento</Label>
          <Select
            value={carneData.empreendimento}
            onValueChange={(v) => update("empreendimento", v)}
          >
            <SelectTrigger className="h-11 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="C.Lagos">C.Lagos</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Estado</Label>
          <Select
            value={carneData.estado}
            onValueChange={(v) => update("estado", v)}
          >
            <SelectTrigger className="h-11 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="BA">BA</SelectItem>
              <SelectItem value="MG">MG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">Cidade</Label>
          <Select
            value={carneData.cidadeEmissao}
            onValueChange={(v) => update("cidadeEmissao", v)}
          >
            <SelectTrigger className="h-11 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Prado">Prado</SelectItem>
              <SelectItem value="Outra">Outra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground">1o Vencimento</Label>
          <Input
            type="date"
            value={carneData.dataBase}
            onChange={(e) => update("dataBase", e.target.value)}
            className="h-11 bg-secondary border-border text-foreground"
          />
        </div>
      </div>

      {/* Summary card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="mb-2 text-sm font-semibold text-primary">Resumo da Emissao</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Parcelas:</span>
            <span className="text-foreground font-medium">
              {carneData.parcelaInicial} a {carneData.parcelaFinal}
            </span>
            <span className="text-muted-foreground">Valor unitario:</span>
            <span className="text-foreground font-medium">
              R${" "}
              {carneData.parcelaFinal >= carneData.parcelaInicial
                ? (
                    carneData.valorTotal /
                    (carneData.parcelaFinal - carneData.parcelaInicial + 1)
                  ).toFixed(2)
                : "0.00"}
            </span>
            <span className="text-muted-foreground">Empreendimento:</span>
            <span className="text-foreground font-medium">{carneData.empreendimento || "-"}</span>
            <span className="text-muted-foreground">Lotes:</span>
            <span className="text-foreground font-medium">
              {carneData.lotes.length > 0
                ? carneData.lotes.map((l) => `L${l.lote}Q${l.quadra}`).join(" ")
                : "Nenhum"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ResultadosEmissao({ resultados }: { resultados: BoletoResult[] }) {
  const sucessos = resultados.filter((r) => r.status === "sucesso").length
  const falhas = resultados.length - sucessos

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-2xl font-bold text-primary">{sucessos}</p>
          <p className="text-sm text-muted-foreground">Sucesso</p>
        </div>
        <div className="flex-1 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-2xl font-bold text-destructive">{falhas}</p>
          <p className="text-sm text-muted-foreground">Falhas</p>
        </div>
      </div>

      <div className="max-h-80 overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Parcela</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Vencimento</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Status</th>
              <th className="hidden px-4 py-3 text-left text-muted-foreground font-medium sm:table-cell">
                Detalhe
              </th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-mono">{r.parcela}</td>
                <td className="px-4 py-3 text-foreground">{r.vencimento}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={r.status === "sucesso" ? "default" : "destructive"}
                    className={
                      r.status === "sucesso"
                        ? "bg-primary/20 text-primary border-0"
                        : "bg-destructive/20 text-destructive border-0"
                    }
                  >
                    {r.status === "sucesso" ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    )}
                    {r.status === "sucesso" ? "OK" : "Falha"}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground truncate max-w-xs sm:table-cell">
                  {r.detalhe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BoletoWizard() {
  const [step, setStep] = useState(1)
  const [isEmitting, setIsEmitting] = useState(false)
  const [emitProgress, setEmitProgress] = useState(0)
  const [resultados, setResultados] = useState<BoletoResult[]>([])
  const [showResults, setShowResults] = useState(false)

  const [cliente, setCliente] = useState<ClienteData>({
    cpfCnpj: "",
    nome: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    email: "",
    telefone: "",
  })

  const getDefaultDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return d.toISOString().split("T")[0]
  }

  const [carne, setCarne] = useState<CarneData>({
    valorTotal: 0,
    contrato: "",
    totalParcelas: 150,
    parcelaInicial: 1,
    parcelaFinal: 1,
    empreendimento: "C.Lagos",
    estado: "BA",
    cidadeEmissao: "Prado",
    dataBase: getDefaultDate(),
    lotes: [],
  })

  const addMonths = (dateStr: string, months: number): string => {
    const d = new Date(dateStr + "T12:00:00")
    d.setMonth(d.getMonth() + months)
    return d.toISOString().split("T")[0]
  }

  const handleEmitir = useCallback(async () => {
    const qtd = carne.parcelaFinal - carne.parcelaInicial + 1
    if (qtd <= 0) {
      toast.error("Intervalo de parcelas invalido")
      return
    }
    if (!cliente.cpfCnpj || !cliente.nome) {
      toast.error("Preencha ao menos CPF e Nome do cliente")
      return
    }

    setIsEmitting(true)
    setEmitProgress(0)
    setResultados([])
    setShowResults(false)

    const results: BoletoResult[] = []
    const valorUnitario = carne.valorTotal / qtd
    const strLotes = carne.lotes.map((l) => `L${l.lote.padStart(2, "0")}Q${l.quadra.padStart(2, "0")}`).join(" ")

    for (let i = 0; i < qtd; i++) {
      const parcela = carne.parcelaInicial + i
      const vencimento = addMonths(carne.dataBase, i)

      // Extrair DDD e telefone
      const telefoneCompleto = cliente.telefone.replace(/\D/g, '') // Remove não-numéricos
      const ddd = telefoneCompleto.substring(0, 2)
      const telefone = telefoneCompleto.substring(2, 11) // Pega até 9 dígitos

      // Determinar tipo de pessoa baseado no CPF/CNPJ
      const cpfCnpjLimpo = cliente.cpfCnpj.replace(/\D/g, '')
      const tipoPessoa = cpfCnpjLimpo.length === 11 ? 'FISICA' : 'JURIDICA'

      const payload: BoletoPayload = {
        seuNumero: carne.contrato,
        valorNominal: valorUnitario,
        dataVencimento: vencimento,
        numDiasAgenda: 60, // Aceitar pagamento até 60 dias após vencimento
        pagador: {
          cpfCnpj: cpfCnpjLimpo,
          tipoPessoa: tipoPessoa,
          nome: cliente.nome,
          endereco: cliente.endereco,
          numero: cliente.numero,
          complemento: "", // Campo opcional
          bairro: cliente.bairro,
          cidade: cliente.cidade,
          uf: cliente.uf,
          cep: cliente.cep.replace(/\D/g, ''),
          email: cliente.email,
          ddd: ddd,
          telefone: telefone,
        },
        mensagem: {
          linha1: `REF PARC ${parcela}/${carne.totalParcelas} ${strLotes} ${carne.empreendimento} ${carne.cidadeEmissao}/${carne.estado}`
        },
        multa: {
          codigo: "PERCENTUAL",
          taxa: 2, // 2% de multa
          data: vencimento // Multa aplicada no dia seguinte ao vencimento
        },
        mora: {
          codigo: "TAXAMENSAL",
          taxa: 3, // 3% ao mês (0.1% ao dia)
          data: vencimento // Mora aplicada a partir do vencimento
        }
      }

      try {
        const resp = await api.emitirBoleto(payload)
        
        // Backend retorna { pdf, nossoNumero } ou { codigoSolicitacao } em caso de sucesso
        // Qualquer resposta sem campo 'error' é sucesso
        if (!resp.error) {
          results.push({
            parcela,
            vencimento: new Date(vencimento + "T12:00:00").toLocaleDateString("pt-BR"),
            status: "sucesso",
            detalhe: resp.nossoNumero || resp.codigoSolicitacao || "Emitido com sucesso",
          })
        } else {
          results.push({
            parcela,
            vencimento: new Date(vencimento + "T12:00:00").toLocaleDateString("pt-BR"),
            status: "falha",
            detalhe: resp.error || "Erro desconhecido",
          })
        }
      } catch (err) {
        results.push({
          parcela,
          vencimento: new Date(vencimento + "T12:00:00").toLocaleDateString("pt-BR"),
          status: "erro",
          detalhe: err instanceof Error ? err.message : "Erro de conexao",
        })
      }

      setEmitProgress(((i + 1) / qtd) * 100)
      // Rate limit
      await new Promise((r) => setTimeout(r, 1200))
    }

    setResultados(results)
    setShowResults(true)
    setIsEmitting(false)
    toast.success("Emissao finalizada!")
  }, [carne, cliente])

  if (showResults) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Resultado da Emissao</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultadosEmissao resultados={resultados} />
          <Button
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setShowResults(false)
              setStep(1)
            }}
          >
            Nova Emissao
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-0">
        <StepIndicator currentStep={step} />
      </CardHeader>
      <CardContent className="pt-6">
        {step === 1 && <StepCliente data={cliente} onChange={setCliente} />}
        {step === 2 && <StepDados data={carne} onChange={setCarne} />}
        {step === 3 && <StepDisparo carneData={carne} onChange={setCarne} />}

        {/* Progress bar during emission */}
        {isEmitting && (
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Processando... {Math.round(emitProgress)}%
              </span>
            </div>
            <Progress value={emitProgress} className="h-2" />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || isEmitting}
            className="border-border bg-transparent text-foreground hover:bg-secondary disabled:opacity-40"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Proximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleEmitir}
              disabled={isEmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isEmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4" />
              )}
              Iniciar Emissao
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
