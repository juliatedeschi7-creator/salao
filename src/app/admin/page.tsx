'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  Store,
  Users,
  PauseCircle,
  PlayCircle,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { profile, loading, logout } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    pausados: 0,
    inativos: 0,
    totalUsuarios: 0
  })

  // 🔥 CONTROLE DE ACESSO CORRIGIDO
  useEffect(() => {
    if (loading) return

    // não logado
    if (!profile) {
      router.push('/login')
      return
    }

    // não é admin
    if ((profile.role as string) !== 'admin_central') {
      router.push('/dashboard')
      return
    }

    carregarStats()
  }, [profile, loading])

  async function carregarStats() {
    const { data } = await supabase
      .from('admin_resumo_saloes')
      .select('*')
      .single()

    const { count: totalUsuarios } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin_central')

    setStats({
      total: data?.total_saloes || 0,
      ativos: data?.saloes_ativos || 0,
      pausados: data?.saloes_pausados || 0,
      inativos: data?.saloes_inativos || 0,
      totalUsuarios: totalUsuarios || 0
    })
  }

  // 🔥 evita tela branca
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hora = new Date().getHours()
  const saudacao =
    hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      
      {/* HEADER */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-400">Painel do Administrador</p>
          <p className="font-bold text-gray-900">Organiza Salão</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin/notificacoes')}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <Bell size={18} className="text-gray-600" />
          </button>

          <div className="w-9 h-9 rounded-full bg-[#E91E8C] flex items-center justify-center text-white font-bold text-sm">
            {profile.nome?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-5">
        
        {/* SAUDAÇÃO */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saudacao}, {profile.nome}! ✨
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>

          <p className="text-[#E91E8C] text-sm font-medium mt-0.5">
            Organiza Salão — Admin Central
          </p>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-2 gap-4">
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Store className="text-[#E91E8C] mb-2" />
            <p className="text-xs text-gray-500">Total de Salões</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <PlayCircle className="text-green-500 mb-2" />
            <p className="text-xs text-gray-500">Ativos</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.ativos}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <PauseCircle className="text-yellow-500 mb-2" />
            <p className="text-xs text-gray-500">Pausados</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pausados}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Users className="text-[#E91E8C] mb-2" />
            <p className="text-xs text-gray-500">Usuários</p>
            <p className="text-2xl font-bold">
              {stats.totalUsuarios}
            </p>
          </div>

        </div>

        {/* AÇÕES */}
        <h2 className="text-lg font-bold text-gray-900">
          Acesso rápido
        </h2>

        <div className="flex flex-col gap-3">

          <button
            onClick={() => router.push('/admin/saloes')}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm"
          >
            <Store className="text-[#E91E8C]" />
            <div className="flex-1 text-left">
              <p className="font-semibold">Gerenciar Salões</p>
              <p className="text-xs text-gray-400">
                Criar, pausar e editar
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button
            onClick={() => router.push('/admin/usuarios')}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm"
          >
            <Users className="text-[#E91E8C]" />
            <div className="flex-1 text-left">
              <p className="font-semibold">Gerenciar Usuários</p>
              <p className="text-xs text-gray-400">
                Aprovar e controlar usuários
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          <button
            onClick={() => router.push('/admin/notificacoes')}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm"
          >
            <Bell className="text-[#E91E8C]" />
            <div className="flex-1 text-left">
              <p className="font-semibold">Notificações</p>
              <p className="text-xs text-gray-400">
                Enviar mensagens
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-4 py-3"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  )
}
