'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle } from 'lucide-react'

export default function LembretesPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<any[]>([])

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    amanha.setHours(0, 0, 0, 0)
    const fimAmanha = new Date(amanha)
    fimAmanha.setHours(23, 59, 59, 999)

    const { data: ags } = await supabase.from('agendamentos')
      .select('*, clientes(nome, profile_id), servicos(nome)')
      .eq('salao_id', profile!.salao_id!)
      .in('status', ['confirmado', 'pendente'])
      .gte('data_hora', new Date().toISOString())
      .order('data_hora')
      .limit(20)
    setAgendamentos(ags || [])
  }

  async function enviarLembrete(ag: any) {
    if (!ag.clientes?.profile_id) return

    const dataHora = new Date(ag.data_hora)
    await supabase.from('notificacoes').insert({
      salao_id: profile!.salao_id,
      remetente_id: profile!.id,
      destinatario_id: ag.clientes.profile_id,
      titulo: '⏰ Lembrete de agendamento',
      mensagem: `Olá ${ag.clientes.nome}! Lembrando do seu ${ag.servicos?.nome} em ${dataHora.toLocaleDateString('pt-BR')} às ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Te esperamos! 💕`,
      tipo: 'lembrete',
    })

    alert(`Lembrete enviado para ${ag.clientes.nome}!`)
  }

  const cor = salao?.cor_primaria || '#E91E8C'

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Lembretes</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="card" style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3' }}>
          <p className="text-sm font-medium" style={{ color: cor }}>
            🤖 Lembretes automáticos
          </p>
          <p className="text-xs text-gray-500 mt-1">
            O sistema envia automaticamente lembretes 24h e 2h antes de cada agendamento confirmado.
          </p>
        </div>

        <p className="font-bold text-gray-900">Próximos agendamentos</p>
        <p className="text-xs text-gray-400">
          Envie lembretes manuais para clientes específicas
        </p>

        {agendamentos.length === 0 ? (
          <div className="card text-center py-10">
            <Clock size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum agendamento próximo</p>
          </div>
        ) : (
          agendamentos.map(ag => {
            const dataHora = new Date(ag.data_hora)
            const temPerfil = !!ag.clientes?.profile_id
            return (
              <div key={ag.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{ag.clientes?.nome}</p>
                    <p className="text-sm text-gray-500">{ag.servicos?.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dataHora.toLocaleDateString('pt-BR')} às{' '}
                      {dataHora.toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ag.status === 'confirmado' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {ag.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>

                {temPerfil ? (
                  <button onClick={() => enviarLembrete(ag)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: cor }}>
                    <Clock size={14} />
                    Enviar lembrete agora
                  </button>
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <CheckCircle size={14} className="text-gray-300" />
                    <p className="text-xs text-gray-400">
                      Cliente sem conta no sistema
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
