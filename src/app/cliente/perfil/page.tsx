'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Save, LogOut } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Package, Bell, User } from 'lucide-react'

export default function ClientePerfilPage() {
  const { profile, loading, logout } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [telefone, setTelefone] = useState('')
  const [confirmacaoNome, setConfirmacaoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

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
    setTelefone(cli?.telefone || '')
  }

  async function handleSalvar() {
    setErro('')
    if (!telefone) { setErro('Informe seu telefone.'); return }
    setSalvando(true)

    await supabase.from('clientes').update({ telefone })
      .eq('id', cliente.id)

    setSalvando(false)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
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
        <h1 className="font-bold text-gray-900 text-lg">Meu Perfil</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 pb-8">
        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-green-600 text-sm text-center font-medium">✅ Salvo!</p>
          </div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3"
            style={{ backgroundColor: cor }}>
            {profile?.nome?.charAt(0).toUpperCase()}
          </div>
          <p className="font-bold text-gray-900 text-lg">{profile?.nome}</p>
          <p className="text-gray-400 text-sm">{profile?.email}</p>
        </div>

        {/* Nome — somente leitura */}
        <div className="card flex flex-col gap-1">
          <p className="text-xs text-gray-400 font-medium uppercase">Nome completo</p>
          <p className="font-medium text-gray-900">{cliente?.nome}</p>
          <p className="text-xs text-gray-400">
            O nome não pode ser alterado. Entre em contato com o salão se necessário.
          </p>
        </div>

        {/* Telefone — editável */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Telefone
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-11" type="tel"
              placeholder="(11) 99999-9999"
              value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>
        </div>

        {/* Data de nascimento — somente leitura */}
        {cliente?.data_nascimento && (
          <div className="card flex flex-col gap-1">
            <p className="text-xs text-gray-400 font-medium uppercase">Data de nascimento</p>
            <p className="font-medium text-gray-900">
              {new Date(cliente.data_nascimento).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm text-center">{erro}</p>
          </div>
        )}

        <button onClick={handleSalvar} disabled={salvando}
          className="btn-primary flex items-center justify-center gap-2"
          style={{ backgroundColor: cor }}>
          <Save size={18} />
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>

        <button onClick={logout}
          className="flex items-center justify-center gap-2 text-gray-400 text-sm py-3">
          <LogOut size={16} />Sair da conta
        </button>
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
