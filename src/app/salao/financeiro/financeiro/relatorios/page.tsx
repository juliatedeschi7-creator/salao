'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

export default function RelatoriosPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'ano'>('mes')
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading, periodo])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const agora = new Date()
    let inicio = new Date()
    if (periodo === 'mes') inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    else if (periodo === 'trimestre') inicio = new Date(agora.getFullYear(), agora.getMonth() - 3, 1)
    else inicio = new Date(agora.getFullYear(), 0, 1)

    const { data: trans } = await supabase.from('transacoes')
      .select('*')
      .eq('salao_id', profile!.salao_id!)
      .gte('data_hora', inicio.toISOString())
      .order('data_hora', { ascending: false })
    setTransacoes(trans || [])

    const { data: profs } = await supabase.from('profiles')
      .select('id, nome')
      .eq('salao_id', profile!.salao_id!)
      .in('role', ['dono_salao', 'funcionario'])
    setProfissionais(profs || [])
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((a, t) => a + (t.valor as number), 0)
  const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + (t.valor as number), 0)
  const lucro = receitas - despesas
  const totalComissoes = transacoes.reduce((a, t) => a + ((t.comissao_valor as number) || 0), 0)
  const lucroReal = lucro - totalComissoes

  const receitasPorCategoria = transacoes
    .filter(t => t.tipo === 'receita' && t.categoria)
    .reduce((acc: Record<string, number>, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + (t.valor as number)
      return acc
    }, {})

  const receitasPorProfissional = transacoes
    .filter(t => t.tipo === 'receita' && t.profissional_id)
    .reduce((acc: Record<string, number>, t) => {
      const prof = profissionais.find(p => p.id === t.profissional_id)
      const nome = prof?.nome || 'Desconhecido'
      acc[nome] = (acc[nome] || 0) + (t.valor as number)
      return acc
    }, {})

  const totalRec = Object.values(receitasPorCategoria).reduce((a: number, b: number) => a + b, 0) || 1
  const totalProf = Object.values(receitasPorProfissional).reduce((a: number, b: number) => a + b, 0) || 1

  const periodoLabel: Record<string, string> = {
    mes: 'Este mês',
    trimestre: 'Últimos 3 meses',
    ano: 'Este ano'
  }

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Relatórios</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Período */}
        <div className="flex bg-white rounded-2xl p-1 gap-1">
          {(['mes', 'trimestre', 'ano'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${periodo === p ? 'text-white' : 'text-gray-400'}`}
              style={periodo === p ? { backgroundColor: cor } : {}}>
              {periodoLabel[p]}
            </button>
          ))}
        </div>

        {/* Resumo geral */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: cor }}>
          <p className="text-white/70 text-sm">Lucro Real</p>
          <p className="text-white text-3xl font-bold mt-1">
            R$ {lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Após comissões (R$ {totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-500" />
              <p className="text-xs text-gray-400">Receitas</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={14} className="text-red-400" />
              <p className="text-xs text-gray-400">Despesas</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} style={{ color: cor }} />
              <p className="text-xs text-gray-400">Comissões</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              R$ {totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-400" />
              <p className="text-xs text-gray-400">Transações</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{transacoes.length}</p>
          </div>
        </div>

        {/* Receita por categoria */}
        {Object.keys(receitasPorCategoria).length > 0 && (
          <div className="card flex flex-col gap-3">
            <p className="font-bold text-gray-900">Receita por Categoria</p>
            {Object.entries(receitasPorCategoria)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([cat, valor]) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-700">{cat}</p>
                    <p className="text-sm font-bold text-gray-900">
                      R$ {(valor as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${((valor as number) / totalRec) * 100}%`,
                        backgroundColor: cor
                      }} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Receita por profissional */}
        {Object.keys(receitasPorProfissional).length > 0 && (
          <div className="card flex flex-col gap-3">
            <p className="font-bold text-gray-900">Receita por Profissional</p>
            {Object.entries(receitasPorProfissional)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([nome, valor]) => (
                <div key={nome}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-700">{nome}</p>
                    <p className="text-sm font-bold text-gray-900">
                      R$ {(valor as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${((valor as number) / totalProf) * 100}%`,
                        backgroundColor: cor
                      }} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Cálculo lucro real */}
        <div className="card flex flex-col gap-2">
          <p className="font-bold text-gray-900">Resumo do período</p>
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Receitas</span>
              <span className="text-green-500 font-medium">
                + R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Despesas</span>
              <span className="text-red-400 font-medium">
                - R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Comissões</span>
              <span className="text-red-400 font-medium">
                - R$ {totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-px bg-gray-200 my-1" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-900">Lucro Real</span>
              <span className="font-bold" style={{ color: cor }}>
                R$ {lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
