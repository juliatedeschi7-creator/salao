'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Home, Calendar, Users, Scissors, BarChart2, LogOut, Bell } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function FuncionarioPage() {
  const { profile, loading, logout } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'funcionario') { router.push('/login'); return }
      if (!profile.aprovado) { router.push('/login'); return }
      carregarDados()
    }
  }, [profile, loading])

  async function carregarDados() {
    if (!profile?.salao_id) return

    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile.salao_id).single()

    if (sal?.pausado) { await supabase.auth.signOut(); router.push('/login'); return }
    setSalao(sal)

    const hoje = new Date()
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString()

    const { data: ags } = await supabase.from('agendamentos')
      .select('*, clientes(nome), servicos(nome)')
      .eq('salao_id', profile.salao_id)
      .eq('profissional_id', profile.id)
      .gte('data_hora', inicio)
      .lte('data_hora', fim)
      .order('data_hora')

    setAgendamentos(ags || [])
    setCarregando(false)
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const hoje = new Date()

  const navItems = [
    { icon: Home, label: 'Início', href: '/funcionario' },
    { icon: Calendar, label: 'Agenda', href: '/funcionario/agenda' },
    { icon: Users, label: 'Clientes', href: '/funcionario/clientes' },
    { icon: Scissors, label: 'Serviços', href: '/funcionario/servicos' },
    { icon: BarChart2, label: 'Financeiro', href: '/funcionario/financeiro' },
  ]

  if (loading || carregando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: cor }} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-20">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-400">{salao?.nome}</p>
          <p className="font-bold text-gray-900 text-sm">Funcionário</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/funcionario/notificacoes')}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell size={18} className="text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: cor }}>
            {profile?.nome?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saudacao}, {profile?.nome?.split(' ')[0]}! ✨
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            <span className="text-2xl font-bold text-gray-900 mr-2">{hoje.getDate()}</span>
            {hoje.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-gray-500">Meus atend. hoje</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{agendamentos.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500">Confirmados</p>
            <p className="text-3xl font-bold mt-1" style={{ color: cor }}>
              {agendamentos.filter(a => a.status === 'confirmado').length}
            </p>
          </div>
        </div>

        <h2 className="font-bold text-gray-900">Minha Agenda Hoje</h2>

        {agendamentos.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum atendimento hoje</p>
          </div>
        ) : (
          agendamentos.map(ag => {
            const hora = new Date(ag.data_hora).toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit'
            })
            const horaFim = new Date(new Date(ag.data_hora).getTime() + ag.duracao_minutos * 60000)
              .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={ag.id} className="card flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-sm font-bold text-gray-900">{hora}</span>
                  <div className="w-0.5 h-4 bg-gray-200 my-0.5" />
                  <span className="text-xs text-gray-400">{horaFim}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{ag.clientes?.nome}</p>
                  <p className="text-sm text-gray-500">{ag.servicos?.nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${ag.status === 'confirmado' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {ag.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>
              </div>
            )
          })
        )}

        <button onClick={logout}
          className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-2 py-3">
          <LogOut size={16} />Sair da conta
        </button>
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
