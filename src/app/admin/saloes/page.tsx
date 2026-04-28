'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, PauseCircle, PlayCircle, Search, CheckCircle } from 'lucide-react'

function SaloesContent() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saloes, setSaloes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState(searchParams.get('filtro') || 'todos')
  const [modalPausa, setModalPausa] = useState<any>(null)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

useEffect(() => {
  if (loading) return
  if (!profile) return // aguarda perfil carregar
  if (profile.role !== 'admin_geral') {
    router.push('/login')
    return
  }
  carregarSaloes()
}, [loading, profile])

  async function carregarSaloes() {
    const { data } = await supabase
      .from('saloes')
      .select('*, profiles!saloes_dono_id_fkey(nome, email)')
      .order('created_at', { ascending: false })

    if (data) {
      setSaloes(data.map((s: any) => ({
        ...s,
        profiles: Array.isArray(s.profiles) ? s.profiles[0] ?? null : s.profiles ?? null,
      })))
    }
  }

  async function aprovar(salao: any) {
    setSalvando(true)
    await supabase.from('saloes').update({ aprovado: true, ativo: true }).eq('id', salao.id)
    await supabase.from('notificacoes').insert({
      salao_id: salao.id,
      remetente_id: profile?.id,
      destinatario_id: salao.dono_id,
      titulo: '🎉 Salão aprovado!',
      mensagem: `Seu salão "${salao.nome}" foi aprovado! Você já pode acessar todas as funcionalidades.`,
      tipo: 'admin'
    })
    setSalvando(false)
    carregarSaloes()
  }

  async function pausar(salao: any) {
    if (!motivo) return
    setSalvando(true)
    await supabase.from('saloes').update({ pausado: true, motivo_pausa: motivo }).eq('id', salao.id)
    await supabase.from('notificacoes').insert({
      salao_id: salao.id,
      remetente_id: profile?.id,
      destinatario_id: salao.dono_id,
      titulo: 'Salão pausado',
      mensagem: `Seu salão foi pausado. Motivo: ${motivo}`,
      tipo: 'admin'
    })
    setModalPausa(null)
    setMotivo('')
    setSalvando(false)
    carregarSaloes()
  }

  async function reativar(salao: any) {
    await supabase.from('saloes').update({ pausado: false, motivo_pausa: null }).eq('id', salao.id)
    await supabase.from('notificacoes').insert({
      salao_id: salao.id,
      remetente_id: profile?.id,
      destinatario_id: salao.dono_id,
      titulo: 'Salão reativado',
      mensagem: 'Seu salão foi reativado! Você já pode acessar normalmente.',
      tipo: 'admin'
    })
    carregarSaloes()
  }

  const saloesFiltrados = saloes.filter(s => {
    const matchBusca = s.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      s.cidade?.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro =
      filtro === 'todos' ? true :
      filtro === 'ativos' ? (!s.pausado && s.aprovado) :
      filtro === 'pausados' ? s.pausado :
      filtro === 'pendentes' ? !s.aprovado : true
    return matchBusca && matchFiltro
  })

  const contadores = {
    todos: saloes.length,
    ativos: saloes.filter(s => !s.pausado && s.aprovado).length,
    pausados: saloes.filter(s => s.pausado).length,
    pendentes: saloes.filter(s => !s.aprovado).length,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f4f6]">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Gerenciar Salões</h1>
        {contadores.pendentes > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {contadores.pendentes} pendente(s)
          </span>
        )}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-11" placeholder="Buscar salão ou cidade..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'pendentes', 'ativos', 'pausados'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filtro === f ? 'bg-[#E91E8C] text-white' : 'bg-white text-gray-500'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({contadores[f]})
            </button>
          ))}
        </div>

        {saloesFiltrados.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400">Nenhum salão encontrado</p>
          </div>
        ) : (
          saloesFiltrados.map(salao => (
            <div key={salao.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{salao.nome}</p>
                    {!salao.aprovado && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Pendente
                      </span>
                    )}
                    {salao.aprovado && salao.pausado && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        Pausado
                      </span>
                    )}
                    {salao.aprovado && !salao.pausado && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{salao.cidade}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Dono: {salao.profiles?.nome} • {salao.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    Cadastro: {new Date(salao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  {salao.pausado && salao.motivo_pausa && (
                    <p className="text-xs text-yellow-600 mt-1">Motivo: {salao.motivo_pausa}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!salao.aprovado && (
                  <button onClick={() => aprovar(salao)} disabled={salvando}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-600 font-medium text-sm">
                    <CheckCircle size={16} />Aprovar
                  </button>
                )}
                {salao.aprovado && !salao.pausado && (
                  <button onClick={() => setModalPausa(salao)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-yellow-50 text-yellow-600 font-medium text-sm">
                    <PauseCircle size={16} />Pausar
                  </button>
                )}
                {salao.pausado && (
                  <button onClick={() => reativar(salao)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-600 font-medium text-sm">
                    <PlayCircle size={16} />Reativar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {modalPausa && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Pausar salão</h3>
            <p className="text-gray-500 text-sm">
              O dono <strong>{modalPausa.profiles?.nome}</strong> não conseguirá
              acessar enquanto pausado.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Motivo</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Ex: Pagamento em atraso..."
                value={motivo} onChange={e => setMotivo(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModalPausa(null); setMotivo('') }}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={() => pausar(modalPausa)}
                disabled={!motivo || salvando}
                className="flex-1 py-3 rounded-2xl bg-yellow-500 text-white font-medium disabled:opacity-50">
                {salvando ? 'Pausando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminSaloesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SaloesContent />
    </Suspense>
  )
}
