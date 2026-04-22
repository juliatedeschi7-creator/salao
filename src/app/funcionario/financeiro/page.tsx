'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, DollarSign } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Users, Scissors, BarChart2 } from 'lucide-react'

export default function FuncionarioFinanceiroPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [periodo, setPeriodo] = useState<'semana' | 'mes'>('mes')
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [profissional, setProfissional] = useState<any>(null)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading, periodo])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: prof } = await supabase.from('profissionais').select('*')
      .eq('profile_id', profile!.id).eq('salao_id', profile!.salao_id!).single()
    setProfissional(prof)

    const agora = new Date()
    let inicio = new Date()
    if (periodo === 'semana') inicio.setDate(agora.getDate() - 7)
    else inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)

    const { data: trans } = await supabase.from('transacoes')
      .select('*')
      .eq('salao_id', profile!.salao_id!)
      .eq('profissional_id', profile!.id)
      .gte('data_hora', inicio.toISOString())
      .order('data_hora', { ascending: false })
    setTransacoes(trans || [])
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const totalFaturado = transacoes.filter(t => t.tipo === 'receita')
    .reduce((a, t) => a + t.valor, 0)
  const totalComissao = transacoes.reduce((a, t) => a + (t.comissao_valor || 0), 0)
  const totalServicos = transacoes.filter(t => t.tipo === 'receita').length

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
        <h1 className="font-bold text-gray-900 text-lg flex-1">Meu Financeiro</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex bg-white rounded-2xl p-1 gap-1">
          {(['semana', 'mes'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${periodo === p ? 'text-white' : 'text-gray-400'}`}
              style={periodo === p ? { backgroundColor: cor } : {}}>
              {p === 'semana' ? 'Esta semana' : 'Este mês'}
            </button>
          ))}
        </div>

        {/* Tipo de contrato */}
        {profissional && (
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3' }}>
              <DollarSign size={18} style={{ color: cor }} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Tipo de contrato</p>
              <p className="font-bold text-gray-900">
                {profissional.tipo_contrato === 'autonomo' ? 'Autônomo' :
                  profissional.tipo_contrato === 'clt' ? 'CLT Fixo' : 'CLT + Comissão'}
              </p>
              {profissional.comissao_percentual > 0 && (
                <p className="text-sm text-gray-400">{profissional.comissao_percentual}% de comissão</p>
              )}
            </div>
          </div>
        )}

        {/* Cards resumo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-gray-400">Total faturado</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-400">Minha comissão</p>
            <p className="text-xl font-bold mt-1" style={{ color: cor }}>
              R$ {totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <TrendingUp size={18} style={{ color: cor }} />
          <div>
            <p className="text-xs text-gray-400">Serviços realizados</p>
            <p className="font-bold text-gray-900">{totalServicos} serviços</p>
          </div>
        </div>

        {/* Histórico */}
        <p className="font-bold text-gray-900">Histórico</p>
        {transacoes.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">Nenhuma transação no período</p>
          </div>
        ) : (
          transacoes.map(t => (
            <div key={t.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{t.descricao}</p>
                <p className="text-xs text-gray-400">
                  {new Date(t.data_hora).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-500 text-sm">
                  R$ {t.valor.toFixed(2).replace('.', ',')}
                </p>
                {t.comissao_valor > 0 && (
                  <p className="text-xs" style={{ color: cor }}>
                    +R$ {t.comissao_valor.toFixed(2).replace('.', ',')} comissão
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
