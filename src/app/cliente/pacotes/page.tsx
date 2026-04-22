'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, CheckCircle } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Bell, User } from 'lucide-react'

export default function ClientePacotesPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [pacotes, setPacotes] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'ativos' | 'antigos' | 'expirados'>('ativos')
  const [modalRegras, setModalRegras] = useState<any>(null)
  const [aceitando, setAceitando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: cli } = await supabase.from('clientes').select('*')
      .eq('profile_id', profile!.id).eq('salao_id', profile!.salao_id!).single()
    setCliente(cli)

    if (cli) {
      const { data: pacs } = await supabase.from('cliente_pacotes')
        .select('*, pacotes(nome, descricao, regras, categoria)')
        .eq('cliente_id', cli.id)
        .order('data_compra', { ascending: false })
      setPacotes(pacs || [])
    }
  }

  async function aceitarRegras(pacoteId: string) {
    setAceitando(true)
    await supabase.from('cliente_pacotes').update({
      regras_aceitas: true,
      data_aceite_regras: new Date().toISOString()
    }).eq('id', pacoteId)
    setAceitando(false)
    setModalRegras(null)
    carregarDados()
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const pacotesFiltrados = pacotes.filter(p => {
    if (filtro === 'ativos') return p.status === 'ativo'
    if (filtro === 'expirados') return p.status === 'expirado'
    return p.status === 'concluido'
  })

  const navItems = [
    { icon: Home, label: 'Início', href: '/cliente' },
    { icon: Calendar, label: 'Agenda', href: '/cliente/agendamentos' },
    { icon: Package, label: 'Pacotes', href: '/cliente/pacotes' },
    { icon: Bell, label: 'Avisos', href: '/cliente/notificacoes' },
    { icon: User, label: 'Perfil', href: '/cliente/perfil' },
  ]

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-20">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Meus Pacotes</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex gap-2">
          {(['ativos', 'antigos', 'expirados'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filtro === f ? 'text-white' : 'bg-white text-gray-500'}`}
              style={filtro === f ? { backgroundColor: cor } : {}}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {pacotesFiltrados.length === 0 ? (
          <div className="card text-center py-10">
            <Package size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum pacote {filtro}</p>
          </div>
        ) : (
          pacotesFiltrados.map(p => (
            <div key={p.id} className="card flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{p.pacotes?.nome}</p>
                  {p.pacotes?.categoria && (
                    <p className="text-xs text-gray-400">{p.pacotes.categoria}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'ativo' ? 'bg-green-50 text-green-600' : p.status === 'expirado' ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-500'}`}>
                  {p.status}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>{p.sessoes_usadas}/{p.sessoes_total} sessões usadas</span>
                {p.data_expiracao && (
                  <span>Vence {new Date(p.data_expiracao).toLocaleDateString('pt-BR')}</span>
                )}
              </div>

              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(p.sessoes_usadas / p.sessoes_total) * 100}%`,
                    backgroundColor: cor
                  }} />
              </div>

              {p.pacotes?.regras && (
                <button onClick={() => setModalRegras(p)}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: cor }}>
                  <CheckCircle size={14} />
                  {p.regras_aceitas ? 'Ver regras do pacote' : 'Ler e aceitar as regras'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal regras */}
      {modalRegras && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[80vh]">
            <h3 className="font-bold text-gray-900 text-lg">
              Regras — {modalRegras.pacotes?.nome}
            </h3>
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-gray-600 leading-relaxed">
                {modalRegras.pacotes?.regras}
              </p>
            </div>
            {!modalRegras.regras_aceitas ? (
              <button onClick={() => aceitarRegras(modalRegras.id)}
                disabled={aceitando}
                className="btn-primary"
                style={{ backgroundColor: cor }}>
                {aceitando ? '...' : '✅ Li e aceito as regras'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3">
                <CheckCircle size={18} className="text-green-500" />
                <p className="text-green-600 text-sm font-medium">
                  Regras aceitas em {new Date(modalRegras.data_aceite_regras).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            <button onClick={() => setModalRegras(null)}
              className="text-gray-400 text-sm text-center py-2">
              Fechar
            </button>
          </div>
        </div>
      )}

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
