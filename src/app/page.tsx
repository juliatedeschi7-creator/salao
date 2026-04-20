'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Scissors, Bell, Users, Store, TrendingUp, LogOut } from 'lucide-react'

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSaloes: 0,
    totalUsuarios: 0,
    atendimentosHoje: 0,
    faturamentoDia: 0,
  })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!prof || prof.role !== 'admin_geral') {
      window.location.href = '/login'
      return
    }

    setProfile(prof)

    const { count: totalSaloes } = await supabase
      .from('saloes')
      .select('*', { count: 'exact', head: true })

    const { count: totalUsuarios } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin_geral')

    const hoje = new Date().toISOString().split('T')[0]

    const { count: atendimentosHoje } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .gte('data_hora', hoje)
      .lt('data_hora', hoje + 'T23:59:59')

    setStats({
      totalSaloes: totalSaloes || 0,
      totalUsuarios: totalUsuarios || 0,
      atendimentosHoje: atendimentosHoje || 0,
      faturamentoDia: 1250,
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="min-h-screen bg-[#f8f4f6]">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={() => {}}>
          <div className="flex flex-col gap-1">
            <div className="w-5 h-0.5 bg-gray-800" />
            <div className="w-5 h-0.5 bg-gray-800" />
            <div className="w-5 h-0.5 bg-gray-800" />
          </div>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center relative">
            <Bell size={18} className="text-gray-600" />
            <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-1" />
          </div>
          <div className="w-9 h-9 rounded-full bg-[#E91E8C] flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {profile?.nome?.charAt(0) || 'A'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-4">
        {/* Saudação */}
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
            Organiza Salão - Adm Geral
          </p>
        </div>

        {/* Cards de métricas */}
        <div className="card flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-3">
              <Scissors size={20} className="text-[#E91E8C]" />
            </div>
            <p className="text-gray-500 text-sm">Atendimentos hoje</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.atendimentosHoje}
            </p>
          </div>
          <div className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
            +12%
          </div>
        </div>

        <div className="card">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-[#E91E8C]" />
          </div>
          <p className="text-gray-500 text-sm">Faturamento do dia</p>
          <p className="text-3xl font-bold text-[#E91E8C] mt-1">
            R$ {stats.faturamentoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-3">
              <Store size={20} className="text-[#E91E8C]" />
            </div>
            <p className="text-gray-500 text-sm">Novos Salões (Mês)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.totalSaloes}
            </p>
          </div>
          <div className="text-[#E91E8C] text-xs font-semibold">
            Meta: 10
          </div>
        </div>

        {/* Acesso Rápido */}
        <h2 className="text-lg font-bold text-gray-900 mt-2">Acesso Rápido</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => window.location.href = '/admin/usuarios'}
            className="btn-primary py-5 flex-col gap-2"
          >
            <Users size={22} />
            <span className="text-sm">Gerenciar Usuários</span>
          </button>

          <button
            onClick={() => window.location.href = '/admin/saloes'}
            className="btn-secondary py-5 flex-col gap-2"
          >
            <Store size={22} className="text-[#E91E8C]" />
            <span className="text-sm">Cadastrar Salão</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-4 py-3"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
