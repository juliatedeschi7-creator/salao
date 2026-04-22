'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Users, Scissors, BarChart2 } from 'lucide-react'

export default function FuncionarioNotificacoesPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [notificacoes, setNotificacoes] = useState<any[]>([])

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: notifs } = await supabase.from('notificacoes')
      .select('*')
      .eq('destinatario_id', profile!.id)
      .order('created_at', { ascending: false })
    setNotificacoes(notifs || [])

    await supabase.from('notificacoes')
      .update({ lida: true })
      .eq('destinatario_id', profile!.id)
      .eq('lida', false)
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const navItems = [
    { icon: Home, label: 'Início', href: '/funcionario' },
    { icon: Calendar, label: 'Agenda', href: '/funcionario/agenda' },
    { icon: Users, label: 'Clientes', href: '/funcionario/clientes' },
    { icon: Scissors, label: 'Serviços', href: '/funcionario/servicos' },
    { icon: BarChart2, label: 'Financeiro', href: '/funcionario/financeiro' },
  ]

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-20">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Notificações</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {notificacoes.length === 0 ? (
          <div className="card text-center py-10">
            <Bell size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhuma notificação</p>
          </div>
        ) : (
          notificacoes.map(n => (
            <div key={n.id}
              className={`card flex flex-col gap-1 ${!n.lida ? 'border-l-4' : ''}`}
              style={!n.lida ? { borderColor: cor } : {}}>
              <div className="flex justify-between items-start">
                <p className="font-semibold text-gray-900 text-sm">{n.titulo}</p>
                <p className="text-xs text-gray-400 ml-2 shrink-0">
                  {new Date(n.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <p className="text-sm text-gray-500">{n.mensagem}</p>
            </div>
          ))
        )}
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
