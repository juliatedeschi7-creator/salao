'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, CheckCircle, Send } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Package, Bell, User } from 'lucide-react'

export default function ClienteAgendamentosPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [horarios, setHorarios] = useState<any[]>([])
  const [dataSelecionada, setDataSelecionada] = useState(new Date())
  const [aba, setAba] = useState<'agendar' | 'historico'>('agendar')
  const [modalSolicitar, setModalSolicitar] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [servicoId, setServicoId] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading, dataSelecionada])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: cli } = await supabase.from('clientes').select('*')
      .eq('profile_id', profile!.id).eq('salao_id', profile!.salao_id!).single()
    setCliente(cli)

    const inicio = new Date(dataSelecionada)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataSelecionada)
    fim.setHours(23, 59, 59, 999)

    const { data: hors } = await supabase.from('horarios_disponiveis')
      .select('*')
      .eq('salao_id', profile!.salao_id!)
      .eq('ocupado', false)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora')
    setHorarios(hors || [])

    if (cli) {
      const { data: ags } = await supabase.from('agendamentos')
        .select('*, servicos(nome), profiles!agendamentos_profissional_id_fkey(nome)')
        .eq('cliente_id', cli.id)
        .order('data_hora', { ascending: false })
      setAgendamentos(ags || [])
    }

    const { data: srvs } = await supabase.from('servicos').select('*')
      .eq('salao_id', profile!.salao_id!).eq('ativo', true)
    setServicos(srvs || [])
  }

  async function solicitarAgendamento() {
    if (!modalSolicitar || !servicoId || !cliente) return
    setEnviando(true)

    const servico = servicos.find(s => s.id === servicoId)

    const { data: ag } = await supabase.from('agendamentos').insert({
      salao_id: profile!.salao_id,
      cliente_id: cliente.id,
      servico_id: servicoId,
      profissional_id: modalSolicitar.profissional_id,
      data_hora: modalSolicitar.data_hora,
      duracao_minutos: servico?.duracao_minutos || modalSolicitar.duracao_minutos,
      status: 'aguardando_confirmacao',
      valor: servico?.preco || 0,
      observacoes: observacoes || null,
      criado_por: profile!.id,
    }).select().single()

    if (ag) {
      await supabase.from('horarios_disponiveis').update({
        ocupado: true, agendamento_id: ag.id
      }).eq('id', modalSolicitar.id)

      const { data: salaoData } = await supabase.from('saloes')
        .select('dono_id').eq('id', profile!.salao_id!).single()

      if (salaoData) {
        await supabase.from('notificacoes').insert({
          salao_id: profile!.salao_id,
          remetente_id: profile!.id,
          destinatario_id: salaoData.dono_id,
          titulo: 'Nova solicitação de agendamento!',
          mensagem: `${profile!.nome} solicitou ${servico?.nome} para ${new Date(modalSolicitar.data_hora).toLocaleDateString('pt-BR')} às ${new Date(modalSolicitar.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
          tipo: 'sistema'
        })
      }
    }

    setModalSolicitar(null)
    setServicoId('')
    setObservacoes('')
    setEnviando(false)
    setSucesso(true)
    carregarDados()
    setTimeout(() => setSucesso(false), 3000)
  }

  function diasDaSemana() {
    const dias = []
    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dias.push(d)
    }
    return dias
  }

  const cor = salao?.cor_primaria || '#E91E8C'
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
        <h1 className="font-bold text-gray-900 text-lg flex-1">Agendamentos</h1>
      </div>

      <div className="flex bg-white border-b border-gray-100">
        {(['agendar', 'historico'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={`flex-1 py-3 text-sm font-medium transition-all ${aba === a ? 'border-b-2' : 'text-gray-400'}`}
            style={aba === a ? { color: cor, borderColor: cor } : {}}>
            {a === 'agendar' ? 'Agendar' : 'Histórico'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-green-600 text-sm text-center font-medium">
              ✅ Solicitação enviada! Aguarde a confirmação do salão.
            </p>
          </div>
        )}

        {aba === 'agendar' && (
          <>
            {/* Calendário horizontal */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {diasDaSemana().map((dia, i) => {
                const selecionado = dia.toDateString() === dataSelecionada.toDateString()
                const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                return (
                  <button key={i} onClick={() => setDataSelecionada(dia)}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[52px] transition-all"
                    style={selecionado ? { backgroundColor: cor } : { backgroundColor: 'white' }}>
                    <span className={`text-xs font-medium ${selecionado ? 'text-white' : 'text-gray-400'}`}>
                      {diasSemana[dia.getDay()]}
                    </span>
                    <span className={`text-lg font-bold ${selecionado ? 'text-white' : 'text-gray-900'}`}>
                      {dia.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="text-sm font-medium text-gray-500">
              {horarios.length} horário(s) disponível(is) em{' '}
              {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {horarios.length === 0 ? (
              <div className="card text-center py-10">
                <Clock size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">Nenhum horário disponível neste dia</p>
              </div>
            ) : (
              horarios.map(h => (
                <button key={h.id}
                  onClick={() => setModalSolicitar(h)}
                  className="card flex items-center gap-3 active:scale-95 transition-all text-left">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3' }}>
                    <Clock size={18} style={{ color: cor }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {new Date(h.data_hora).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-400">{h.duracao_minutos} minutos</p>
                  </div>
                  <span className="ml-auto text-sm font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3', color: cor }}>
                    Disponível
                  </span>
                </button>
              ))
            )}
          </>
        )}

        {aba === 'historico' && (
          agendamentos.length === 0 ? (
            <div className="card text-center py-10">
              <Calendar size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum agendamento ainda</p>
            </div>
          ) : (
            agendamentos.map(ag => (
              <div key={ag.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{ag.servicos?.nome}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {new Date(ag.data_hora).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(ag.data_hora).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    {ag.profiles?.nome && (
                      <p className="text-xs text-gray-400">Prof: {ag.profiles.nome}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ag.status === 'concluido' ? 'bg-gray-100 text-gray-500' : ag.status === 'confirmado' ? 'bg-green-50 text-green-600' : ag.status === 'cancelado' ? 'bg-red-50 text-red-400' : 'bg-yellow-50 text-yellow-600'}`}>
                    {ag.status === 'concluido' ? 'Concluído' :
                      ag.status === 'confirmado' ? 'Confirmado' :
                        ag.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal solicitar */}
      {modalSolicitar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Solicitar Agendamento</h3>
            <p className="text-gray-500 text-sm">
              <Clock size={14} className="inline mr-1" />
              {new Date(modalSolicitar.data_hora).toLocaleDateString('pt-BR')} às{' '}
              {new Date(modalSolicitar.data_hora).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit'
              })}
            </p>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Serviço</label>
              <select className="input-field" value={servicoId}
                onChange={e => setServicoId(e.target.value)}>
                <option value="">Selecione o serviço...</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — R$ {s.preco.toFixed(2)} ({s.duracao_minutos}min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Observações
              </label>
              <textarea className="input-field resize-none" rows={2}
                placeholder="Alguma preferência ou informação?"
                value={observacoes} onChange={e => setObservacoes(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalSolicitar(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={solicitarAgendamento}
                disabled={!servicoId || enviando}
                className="flex-1 py-3 rounded-2xl text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: cor }}>
                {enviando
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Send size={16} />Solicitar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
