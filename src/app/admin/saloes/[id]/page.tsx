'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Store, User, MapPin, Phone, Instagram, Palette, PauseCircle, PlayCircle, CheckCircle } from 'lucide-react'

export default function AdminSalaoDetalhePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [salao, setSalao] = useState<any>(null)
  const [dono, setDono] = useState<any>(null)
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalAgendamentos: 0,
    totalFuncionarios: 0,
  })
  const [modalPausa, setModalPausa] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.role === 'admin_geral') carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', params.id as string).single()
    setSalao(sal)

    if (sal?.dono_id) {
      const { data: don } = await supabase.from('profiles').select('*')
        .eq('id', sal.dono_id).single()
      setDono(don)
    }

    const { count: totalClientes } = await supabase.from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('salao_id', params.id as string)

    const { count: totalAgendamentos } = await supabase.from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('salao_id', params.id as string)

    const { count: totalFuncionarios } = await supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('salao_id', params.id as string)
      .eq('role', 'funcionario')

    setStats({
      totalClientes: totalClientes || 0,
      totalAgendamentos: totalAgendamentos || 0,
      totalFuncionarios: totalFuncionarios || 0,
    })
  }

  async function aprovar() {
    setSalvando(true)
    await supabase.from('saloes').update({ aprovado: true, ativo: true })
      .eq('id', params.id as string)

    await supabase.from('notificacoes').insert({
      salao_id: params.id,
      remetente_id: profile?.id,
      destinatario_id: salao.dono_id,
      titulo: '🎉 Salão aprovado!',
      mensagem: `Seu salão "${salao.nome}" foi aprovado! Você já pode acessar todas as funcionalidades.`,
      tipo: 'admin'
    })

    setSalvando(false)
    carregarDados()
  }

  async function pausar() {
    if (!motivo) return
    setSalvando(true)
    await supabase.from('saloes').update({ pausado: true, motivo_pausa: motivo })
      .eq('id', params.id as string)

    await supabase.from('notificacoes').insert({
      salao_id: params.id,
      remetente_id: profile?.id,
      destinatario_id: salao.dono_id,
      titulo: 'Salão pausado',
      mensagem: `Seu salão foi pausado. Motivo: ${motivo}`,
      tipo: 'admin'
    })

    setModalPausa(false)
    setMotivo('')
    setSalvando(false)
    carregarDados()
  }

  async function reativar() {
    await supabase.from('saloes').update({ pausado: false, motivo_pausa: null })
      .eq('id', params.id as string)

    await supabase.from('notificacoes').insert({
      salao_id: params.id,
      remetente_id: profile?.id,
      destinatario_id: salao.dono_id,
      titulo: 'Salão reativado',
      mensagem: 'Seu salão foi reativado! Você já pode acessar normalmente.',
      tipo: 'admin'
    })

    carregarDados()
  }

  if (!salao) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{salao.nome}</h1>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${!salao.aprovado ? 'bg-blue-100 text-blue-700' : salao.pausado ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {!salao.aprovado ? 'Pendente' : salao.pausado ? 'Pausado' : 'Ativo'}
        </span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Prévia das cores */}
        <div className="h-16 rounded-2xl flex items-center justify-center gap-3"
          style={{ backgroundColor: salao.cor_primaria }}>
          <div className="w-8 h-8 rounded-full bg-white/30" />
          <p className="text-white font-bold">{salao.nome}</p>
        </div>

        {/* Info do salão */}
        <div className="card flex flex-col gap-3">
          <p className="font-bold text-gray-900">Informações</p>
          {[
            { icon: MapPin, label: 'Cidade', value: salao.cidade },
            { icon: Phone, label: 'Telefone', value: salao.telefone },
            { icon: Instagram, label: 'Instagram', value: salao.instagram },
            { icon: Palette, label: 'Cor primária', value: salao.cor_primaria },
          ].map(({ icon: Icon, label, value }) => value && (
            <div key={label} className="flex items-center gap-3">
              <Icon size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            Cadastrado em {new Date(salao.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Info do dono */}
        {dono && (
          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center">
              <User size={20} className="text-[#E91E8C]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Dono</p>
              <p className="font-bold text-gray-900">{dono.nome}</p>
              <p className="text-sm text-gray-400">{dono.email}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Clientes', value: stats.totalClientes },
            { label: 'Agendamentos', value: stats.totalAgendamentos },
            { label: 'Funcionários', value: stats.totalFuncionarios },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          {!salao.aprovado && (
            <button onClick={aprovar} disabled={salvando}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 text-green-600 font-medium">
              <CheckCircle size={18} />Aprovar Salão
            </button>
          )}
          {salao.aprovado && !salao.pausado && (
            <button onClick={() => setModalPausa(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-yellow-50 text-yellow-600 font-medium">
              <PauseCircle size={18} />Pausar Salão
            </button>
          )}
          {salao.pausado && (
            <>
              <div className="card bg-yellow-50">
                <p className="text-xs text-yellow-600 font-medium">Motivo da pausa:</p>
                <p className="text-sm text-yellow-700 mt-0.5">{salao.motivo_pausa}</p>
              </div>
              <button onClick={reativar}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 text-green-600 font-medium">
                <PlayCircle size={18} />Reativar Salão
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal pausa */}
      {modalPausa && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Pausar Salão</h3>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Motivo</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Ex: Pagamento em atraso..."
                value={motivo} onChange={e => setMotivo(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setModalPausa(false); setMotivo('') }}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={pausar} disabled={!motivo || salvando}
                className="flex-1 py-3 rounded-2xl bg-yellow-500 text-white font-medium disabled:opacity-50">
                {salvando ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
