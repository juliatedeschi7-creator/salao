'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Store, Users, PauseCircle, Bell, LogOut, ChevronRight, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { profile, loading, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    total: 0, ativos: 0, pausados: 0, pendentes: 0, totalUsuarios: 0
  })

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'admin_geral') router.push('/login')
      else carregarStats()
    }
  }, [profile, loading])

  async function carregarStats() {
    const { data } = await supabase
      .from('admin_resumo_saloes')
      .select('*')
      .single()

    const { count: totalUsuarios } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin_geral')

    setStats({
      total: data?.total_saloes || 0,
      ativos: data?.saloes_ativos || 0,
      pausados: data?.saloes_pausados || 0,
      pendentes: data?.saloes_pendentes || 0,
      totalUsuarios: totalUsuarios || 0
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen bg-[#f8f4f6]">
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-400">Painel do Administrador</p>
          <p className="font-bold text-gray-900">Organiza Salão</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/notificacoes')}
            className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell size={18} className="text-gray-600" />
            {stats.pendentes > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E91E8C] text-white text-xs flex items-center justify-center font-bold">
                {stats.pendentes}
              </span>
            )}
          </button>
          <div className="w-9 h-9 rounded-full bg-[#E91E8C] flex items-center justify-center text-white font-bold text-sm">
            {profile?.nome?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {saudacao}, {profile?.nome}! ✨
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </p>
          <p className="text-[#E91E8C] text-sm font-medium mt-0.5">
            Organiza Salão — Adm Geral
          </p>
        </div>

        {/* Cards de stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-2">
              <Store size={20} className="text-[#E91E8C]" />
            </div>
            <p className="text-gray-500 text-xs">Total de Salões</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="card">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Store size={20} className="text-green-500" />
            </div>
            <p className="text-gray-500 text-xs">Salões Ativos</p>
            <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
          </div>

          <div className="card">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
              <PauseCircle size={20} className="text-yellow-500" />
            </div>
            <p className="text-gray-500 text-xs">Salões Pausados</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pausados}</p>
          </div>

          <div className="card">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <Clock size={20} className="text-blue-500" />
            </div>
            <p className="text-gray-500 text-xs">Aguard. Aprovação</p>
            <p className="text-3xl font-bold text-blue-600">{stats.pendentes}</p>
          </div>
        </div>

        {/* Pendentes — destaque */}
        {stats.pendentes > 0 && (
          <button onClick={() => router.push('/admin/saloes?filtro=pendentes')}
            className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Clock size={20} className="text-blue-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-semibold text-blue-700 text-sm">
                {stats.pendentes} salão(ões) aguardando aprovação
              </p>
              <p className="text-xs text-blue-500">Toque para revisar</p>
            </div>
            <ChevronRight size={18} className="text-blue-300" />
          </button>
        )}

        {/* Acesso rápido */}
        <h2 className="text-lg font-bold text-gray-900 mt-2">Acesso Rápido</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Gerenciar Salões', desc: 'Aprovar, pausar e editar salões', href: '/admin/saloes', icon: Store },
            { label: 'Gerenciar Usuários', desc: 'Aprovar e controlar usuários', href: '/admin/usuarios', icon: Users },
            { label: 'Enviar Notificações', desc: 'Mensagens para os donos', href: '/admin/notificacoes', icon: Bell },
          ].map(({ label, desc, href, icon: Icon }) => (
            <button key={href} onClick={() => router.push(href)}
              className="card flex items-center gap-4 text-left active:scale-95 transition-all">
              <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[#E91E8C]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </div>

        <button onClick={logout}
          className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-2 py-3">
          <LogOut size={16} />Sair da conta
        </button>
      </div>
    </div>
  )
}
