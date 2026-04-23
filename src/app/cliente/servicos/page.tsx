'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scissors, Image, MessageSquare, Star, Send } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Package, Bell, User } from 'lucide-react'

export default function ClienteServicosPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [modalServico, setModalServico] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [depoimentos, setDepoimentos] = useState<any[]>([])
  const [abaModal, setAbaModal] = useState<'fotos' | 'depoimentos'>('fotos')
  const [novoDepoimento, setNovoDepoimento] = useState('')
  const [enviandoDep, setEnviandoDep] = useState(false)
  const [jaDepoiu, setJaDepoiu] = useState(false)

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

    const { data: srvs } = await supabase.from('servicos').select('*')
      .eq('salao_id', profile!.salao_id!).eq('ativo', true).order('nome')
    setServicos(srvs || [])
  }

  async function abrirModalServico(servico: any) {
    setModalServico(servico)
    setAbaModal('fotos')
    setNovoDepoimento('')

    const { data: fts } = await supabase.from('fotos_servicos').select('*')
      .eq('servico_id', servico.id).order('created_at', { ascending: false })
    setFotos(fts || [])

    const { data: deps } = await supabase.from('depoimentos')
      .select('*, clientes(nome)')
      .eq('servico_id', servico.id)
      .eq('publico', true)
      .order('created_at', { ascending: false })
    setDepoimentos(deps || [])

    if (cliente) {
      const jaExiste = deps?.find(d => d.cliente_id === cliente.id)
      setJaDepoiu(!!jaExiste)
    }
  }

  async function enviarDepoimento() {
    if (!novoDepoimento.trim() || !cliente || !modalServico) return
    setEnviandoDep(true)

    await supabase.from('depoimentos').insert({
      salao_id: profile!.salao_id,
      cliente_id: cliente.id,
      servico_id: modalServico.id,
      texto: novoDepoimento.trim(),
      publico: true,
    })

    setNovoDepoimento('')
    setJaDepoiu(true)
    setEnviandoDep(false)

    const { data: deps } = await supabase.from('depoimentos')
      .select('*, clientes(nome)')
      .eq('servico_id', modalServico.id)
      .eq('publico', true)
      .order('created_at', { ascending: false })
    setDepoimentos(deps || [])
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const corSec = salao?.cor_secundaria || '#FCE4F3'
  const categorias = ['Todos', ...Array.from(new Set(servicos.map(s => s.categoria)))]
  const servicosFiltrados = servicos.filter(s =>
    categoriaFiltro === 'Todos' || s.categoria === categoriaFiltro
  )

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
        <h1 className="font-bold text-gray-900 text-lg">Serviços</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map(c => (
            <button key={c} onClick={() => setCategoriaFiltro(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${categoriaFiltro === c ? 'text-white' : 'bg-white text-gray-500'}`}
              style={categoriaFiltro === c ? { backgroundColor: cor } : {}}>
              {c}
            </button>
          ))}
        </div>

        {servicosFiltrados.map(s => {
          return (
            <div key={s.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{s.nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {s.categoria}
                    </span>
                  </div>
                  {s.descricao && (
                    <p className="text-sm text-gray-400 mt-0.5">{s.descricao}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-bold" style={{ color: cor }}>
                      R$ {s.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-gray-400">{s.duracao_minutos} min</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: corSec }}>
                  <Scissors size={20} style={{ color: cor }} />
                </div>
              </div>

              <button onClick={() => abrirModalServico(s)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2"
                style={{ borderColor: cor, color: cor }}>
                <Image size={14} />
                <MessageSquare size={14} />
                Ver fotos e depoimentos reais
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal fotos e depoimentos */}
      {modalServico && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl flex flex-col max-h-[90vh]">
            {/* Header modal */}
            <div className="px-6 pt-6 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{modalServico.nome}</h3>
                  <p className="text-sm text-gray-400">Fotos e depoimentos reais</p>
                </div>
                <button onClick={() => setModalServico(null)}
                  className="text-gray-400 text-xl font-bold">✕</button>
              </div>

              <div className="flex gap-1 mt-3 bg-gray-100 rounded-xl p-1">
                {(['fotos', 'depoimentos'] as const).map(a => (
                  <button key={a} onClick={() => setAbaModal(a)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${abaModal === a ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                    style={abaModal === a ? { color: cor } : {}}>
                    {a === 'fotos' ? `📸 Fotos (${fotos.length})` : `💬 Depoimentos (${depoimentos.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {abaModal === 'fotos' && (
                fotos.length === 0 ? (
                  <div className="text-center py-10">
                    <Image size={36} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">Nenhuma foto ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {fotos.map(f => (
                      <div key={f.id} className="relative rounded-2xl overflow-hidden bg-gray-100">
                        <img src={f.url} alt={f.descricao || 'Foto'}
                          className="w-full h-40 object-cover" />
                        {f.descricao && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                            <p className="text-white text-xs">{f.descricao}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {abaModal === 'depoimentos' && (
                <div className="flex flex-col gap-3 mt-2">
                  {/* Campo para deixar depoimento */}
                  {!jaDepoiu ? (
                    <div className="card flex flex-col gap-3"
                      style={{ backgroundColor: corSec }}>
                      <p className="text-sm font-medium" style={{ color: cor }}>
                        ✍️ Deixe seu depoimento
                      </p>
                      <textarea
                        className="input-field resize-none bg-white"
                        rows={3}
                        placeholder="Conte como foi sua experiência com este serviço..."
                        value={novoDepoimento}
                        onChange={e => setNovoDepoimento(e.target.value)}
                      />
                      <button onClick={enviarDepoimento}
                        disabled={!novoDepoimento.trim() || enviandoDep}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: cor }}>
                        {enviandoDep
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <><Send size={14} />Enviar depoimento</>}
                      </button>
                    </div>
                  ) : (
                    <div className="card flex items-center gap-2"
                      style={{ backgroundColor: corSec }}>
                      <Star size={16} style={{ color: cor }} />
                      <p className="text-sm font-medium" style={{ color: cor }}>
                        Você já deixou seu depoimento!
                      </p>
                    </div>
                  )}

                  {/* Lista de depoimentos */}
                  {depoimentos.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare size={36} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400">Nenhum depoimento ainda</p>
                      <p className="text-gray-400 text-sm">Seja a primeira a comentar!</p>
                    </div>
                  ) : (
                    depoimentos.map(d => (
                      <div key={d.id} className="card flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ backgroundColor: cor }}>
                            {d.clientes?.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {d.clientes?.nome}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(d.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          "{d.texto}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
