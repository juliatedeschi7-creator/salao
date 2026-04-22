'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Users, Scissors, BarChart2 } from 'lucide-react'

export default function FuncionarioAgendaPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [dataSelecionada, setDataSelecionada] = useState(new Date())

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading, dataSelecionada])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const inicio = new Date(dataSelecionada)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataSelecionada)
    fim.setHours(23, 59, 59, 999)

    const { data: ags } = await supabase.from('agendamentos')
      .select('*, clientes(nome), servicos(nome, categoria)')
      .eq('salao_id', profile!.salao_id!)
      .eq('profissional_id', profile!.id)
      .gte('data_hora', inicio.toISOString())
      .lte('data_hora', fim.toISOString())
      .order('data_hora')
    setAgendamentos(ags || [])
  }

  async function concluirAtendimento(id: string) {
    await supabase.from('agendamentos').update({
      status: 'concluido',
      confirmado_por: profile?.id
    }).eq('id', id)
    carregarDados()
  }

  function diasDaSemana() {
    const dias = []
    const inicio = new Date(dataSelecionada)
    const diaSemana = inicio.getDay()
    inicio.setDate(inicio.getDate() - diaSemana + 1)
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      dias.push(d)
    }
    return dias
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const navItems = [
    { icon: Home, label: 'Início', href: '/funcionario' },
    { icon: Calendar, label: 'Agenda', href: '/funcionario/agenda' },
    { icon: Users, label: 'Clientes', href: '/funcionario/clientes' },
    { icon: Scissors, label: 'Serviços', href: '/funcionario/servicos' },
    { icon: BarChart2, label: 'Financeiro', href: '/funcionario/financeiro' },
  ]

  const diasSemanaLabel = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-20">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Minha Agenda</h1>
      </div>

      <div className="bg-white px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
          {diasDaSemana().map((dia, i) => {
            const selecionado = dia.toDateString() === dataSelecionada.toDateString()
            const isHoje = dia.toDateString() === new Date().toDateString()
            return (
              <button key={i} onClick={() => setDataSelecionada(dia)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[52px] transition-all"
                style={selecionado ? { backgroundColor: cor } : {}}>
                <span className={`text-xs font-medium ${selecionado ? 'text-white' : 'text-gray-400'}`}>
                  {diasSemanaLabel[i]}
                </span>
                <span className={`text-lg font-bold ${selecionado ? 'text-white' : 'text-gray-900'}`}>
                  {dia.getDate()}
                </span>
                {isHoje && !selecionado && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {agendamentos.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum atendimento neste dia</p>
          </div>
        ) : (
          agendamentos.map(ag => {
            const hora = new Date(ag.data_hora).toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit'
            })
            const horaFim = new Date(new Date(ag.data_hora).getTime() + ag.duracao_minutos * 60000)
              .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={ag.id} className="card flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-sm font-bold text-gray-900">{hora}</span>
                    <div className="w-0.5 h-3 bg-gray-200 my-0.5" />
                    <span className="text-xs text-gray-400">{horaFim}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-gray-900">{ag.clientes?.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ag.status === 'confirmado' ? 'bg-green-50 text-green-600' : ag.status === 'concluido' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50 text-yellow-600'}`}>
                        {ag.status === 'confirmado' ? 'CONFIRMADO' : ag.status === 'concluido' ? 'CONCLUÍDO' : 'PENDENTE'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{ag.servicos?.nome}</p>
                    {ag.valor && (
                      <p className="text-sm font-medium mt-0.5" style={{ color: cor }}>
                        R$ {ag.valor.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  </div>
                </div>

                {ag.status === 'confirmado' && (
                  <button onClick={() => concluirAtendimento(ag.id)}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: cor }}>
                    <CheckCircle size={16} />
                    Marcar como Concluído
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
