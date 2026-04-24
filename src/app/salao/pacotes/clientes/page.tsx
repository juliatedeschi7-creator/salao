'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Package, Search } from 'lucide-react'

export default function PacotesClientesPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [clientePacotes, setClientePacotes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [pacotes, setPacotes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    cliente_id: '', pacote_id: '', data_compra: new Date().toISOString().slice(0, 10)
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: cps } = await supabase.from('cliente_pacotes')
      .select('*, clientes(nome), pacotes(nome, sessoes, validade_dias)')
      .eq('clientes.salao_id', profile!.salao_id!)
      .order('data_compra', { ascending: false })
    setClientePacotes(cps || [])

    const { data: clis } = await supabase.from('clientes').select('id, nome')
      .eq('salao_id', profile!.salao_id!).order('nome')
    setClientes(clis || [])

    const { data: pacs } = await supabase.from('pacotes').select('*')
      .eq('salao_id', profile!.salao_id!).eq('status', 'ativo')
    setPacotes(pacs || [])
  }

  async function atribuirPacote() {
    if (!form.cliente_id || !form.pacote_id) return
    setSalvando(true)

    const pacote = pacotes.find(p => p.id === form.pacote_id)
    if (!pacote) return

    const dataCompra = new Date(form.data_compra)
    const dataExpiracao = new Date(dataCompra)
    dataExpiracao.setDate(dataExpiracao.getDate() + pacote.validade_dias)

    await supabase.from('cliente_pacotes').insert({
      cliente_id: form.cliente_id,
      pacote_id: form.pacote_id,
      sessoes_total: pacote.sessoes,
      sessoes_usadas: 0,
      data_compra: dataCompra.toISOString(),
      data_expiracao: dataExpiracao.toISOString(),
      status: 'ativo',
      regras_aceitas: false,
    })

    const cliente = clientes.find(c => c.id === form.cliente_id)
    const { data: clienteData } = await supabase.from('clientes')
      .select('profile_id').eq('id', form.cliente_id).single()

    if (clienteData?.profile_id) {
      await supabase.from('notificacoes').insert({
        salao_id: profile!.salao_id,
        remetente_id: profile!.id,
        destinatario_id: clienteData.profile_id,
        titulo: '🎉 Pacote adicionado!',
        mensagem: `O pacote "${pacote.nome}" foi adicionado à sua conta. Acesse para ver as regras.`,
        tipo: 'sistema'
      })
    }

    setModal(false)
    setForm({ cliente_id: '', pacote_id: '', data_compra: new Date().toISOString().slice(0, 10) })
    setSalvando(false)
    carregarDados()
  }

  async function registrarSessao(cpId: string, cp: any) {
    const novasUsadas = cp.sessoes_usadas + 1
    const novoStatus = novasUsadas >= cp.sessoes_total ? 'concluido' : 'ativo'

    await supabase.from('cliente_pacotes').update({
      sessoes_usadas: novasUsadas,
      status: novoStatus,
    }).eq('id', cpId)

    carregarDados()
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const filtrados = clientePacotes.filter(cp =>
    cp.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    cp.pacotes?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Pacotes por Cliente</h1>
        <button onClick={() => setModal(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: cor }}>
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-11" placeholder="Buscar cliente ou pacote..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {filtrados.length === 0 ? (
          <div className="card text-center py-10">
            <Package size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum pacote atribuído ainda</p>
          </div>
        ) : (
          filtrados.map(cp => (
            <div key={cp.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{cp.clientes?.nome}</p>
                  <p className="text-sm text-gray-500">{cp.pacotes?.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Comprado em {new Date(cp.data_compra).toLocaleDateString('pt-BR')}
                  </p>
                  {cp.data_expiracao && (
                    <p className="text-xs text-gray-400">
                      Vence {new Date(cp.data_expiracao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cp.status === 'ativo' ? 'bg-green-50 text-green-600' : cp.status === 'expirado' ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-500'}`}>
                  {cp.status}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>{cp.sessoes_usadas}/{cp.sessoes_total} sessões</span>
                <span style={{ color: cor }}>
                  {cp.sessoes_total - cp.sessoes_usadas} restantes
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(cp.sessoes_usadas / cp.sessoes_total) * 100}%`,
                    backgroundColor: cor
                  }} />
              </div>

              {cp.status === 'ativo' && cp.sessoes_usadas < cp.sessoes_total && (
                <button onClick={() => registrarSessao(cp.id, cp)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: cor }}>
                  + Registrar sessão usada
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Atribuir Pacote</h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Cliente</label>
              <select className="input-field" value={form.cliente_id}
                onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))}>
                <option value="">Selecione a cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Pacote</label>
              <select className="input-field" value={form.pacote_id}
                onChange={e => setForm(p => ({ ...p, pacote_id: e.target.value }))}>
                <option value="">Selecione o pacote...</option>
                {pacotes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.sessoes}x — R$ {p.preco.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Data de compra
              </label>
              <input className="input-field" type="date" value={form.data_compra}
                onChange={e => setForm(p => ({ ...p, data_compra: e.target.value }))} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={atribuirPacote}
                disabled={!form.cliente_id || !form.pacote_id || salvando}
                className="flex-1 py-3 rounded-2xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: cor }}>
                {salvando ? '...' : 'Atribuir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
