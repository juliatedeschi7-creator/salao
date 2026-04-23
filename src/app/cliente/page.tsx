'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Home, Calendar, Package, Bell, User, Scissors } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function ClientePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [proximoAg, setProximoAg] = useState<any>(null)
  const [pacotesAtivos, setPacotesAtivos] = useState<any[]>([])

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'cliente') { router.push('/login'); return }
      carregarDados()
    }
  }, [profile, loading])

  async function carregarDados() {
    if (!profile?.salao_id) return

    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile.salao_id).single()
    setSalao(sal)

    const { data: cli } = await supabase.from('clientes').select('*')
      .eq('profile_id', profile.id).eq('salao_id', profile.salao_id).single()
    setCliente(cli)

    if (cli) {
      const { data: ag } = await supabase.from('agendamentos')
        .select('*, servicos(nome)')
        .eq('cliente_id', cli.id)
        .gte('data_hora', new Date().toISOString())
        .in('status', ['confirmado', 'pendente'])
        .order('data_hora').limit(1).single()
      setProximoAg(ag)

      const { data: pacs } = await supabase.from('cliente_pacotes')
        .select('*, pacotes(nome)')
        .eq('cliente_id', cli.id).eq('status', 'ativo')
      setPacotesAtivos(pacs || [])
    }
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const corSec = salao?.cor_secundaria || '#FCE4F3'

  const navItems = [
    { icon: Home, label: 'Início', href: '/cliente' },
    { icon: Calendar, label: 'Agenda', href: '/cliente/agendamentos' },
    { icon: Package, label: 'Pacotes', href: '/cliente/pacotes' },
    { icon: Bell, label: 'Avisos', href: '/cliente/notificacoes' },
    { icon: User, label: 'Perfil', href: '/cliente/perfil' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: cor }} />
    </div>
  )

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-20">
      <div className="px-4 py-5 flex items-center justify-between"
        style={{ backgroundColor: cor }}>
        <div>
          <p className="text-white/70 text-sm">{salao?.nome}</p>
          <h1 className="text-white text-xl font-bold mt-0.5">
            {saudacao}, {profile?.nome?.split(' ')[0]}! ✨
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/cliente/notificacoes')}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bell size={18} className="text-white" />
          </button>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {profile?.nome?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {proximoAg ? (
          <div className="card border-l-4" style={{ borderColor: cor }}>
            <p className="text-xs font-medium text-gray-400 mb-1">Próximo agendamento</p>
            <p className="font-bold text-gray-900">{proximoAg.servicos?.nome}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(proximoAg.data_hora).toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long'
              })} às {new Date(proximoAg.data_hora).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${proximoAg.status === 'confirmado' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
              {proximoAg.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
            </span>
          </div>
        ) : (
          <div className="card flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: corSec }}>
              <Calendar size={22} style={{ color: cor }} />
            </div>
            <p className="text-gray-500 text-sm text-center">
              Nenhum agendamento próximo
            </p>
            <button onClick={() => router.push('/cliente/agendamentos')}
              className="px-4 py-2 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: cor }}>
              Agendar agora
            </button>
          </div>
        )}

        {pacotesAtivos.length > 0 && (
          <>
            <h2 className="font-bold text-gray-900">Meus Pacotes</h2>
            {pacotesAtivos.map(p => (
              <div key={p.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-900">{p.pacotes?.nome}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                    Ativo
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{p.sessoes_usadas}/{p.sessoes_total} sessões</span>
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
              </div>
            ))}
          </>
        )}

        <h2 className="font-bold text-gray-900">Serviços</h2>

        <button onClick={() => router.push('/cliente/servicos')}
          className="card flex items-center gap-3 active:scale-95 transition-all">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: corSec }}>
            <Scissors size={20} style={{ color: cor }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Ver serviços do salão</p>
            <p className="text-sm text-gray-400">Fotos, depoimentos e agendamento</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
