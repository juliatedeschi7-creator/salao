'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Unlock, TrendingUp, TrendingDown } from 'lucide-react'

export default function CaixaPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [caixaHoje, setCaixaHoje] = useState<any>(null)
  const [transacoesHoje, setTransacoesHoje] = useState<any[]>([])
  const [valorInicial, setValorInicial] = useState('')
  const [abrindo, setAbrindo] = useState(false)
  const [fechando, setFechando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const hoje = new Date().toISOString().slice(0, 10)
    const { data: caixa } = await supabase.from('caixas_diarios')
      .select('*').eq('salao_id', profile!.salao_id!).eq('data', hoje).single()
    setCaixaHoje(caixa)

    const inicioHoje = new Date()
    inicioHoje.setHours(0, 0, 0, 0)
    const { data: trans } = await supabase.from('transacoes')
      .select('*')
      .eq('salao_id', profile!.salao_id!)
      .gte('data_hora', inicioHoje.toISOString())
      .order('data_hora', { ascending: false })
    setTransacoesHoje(trans || [])
  }

  async function abrirCaixa() {
    if (!valorInicial) return
    setAbrindo(true)
    const hoje = new Date().toISOString().slice(0, 10)

    await supabase.from('caixas_diarios').insert({
      salao_id: profile!.salao_id,
      data: hoje,
      valor_inicial: parseFloat(valorInicial),
      aberto_por: profile!.id,
      status: 'aberto',
    })

    setAbrindo(false)
    setValorInicial('')
    carregarDados()
  }

  async function fecharCaixa() {
    if (!caixaHoje) return
    setFechando(true)

    const receitas = transacoesHoje.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
    const despesas = transacoesHoje.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
    const valorFinal = (caixaHoje.valor_inicial || 0) + receitas - despesas

    await supabase.from('caixas_diarios').update({
      valor_final: valorFinal,
      fechado_por: profile!.id,
      status: 'fechado',
    }).eq('id', caixaHoje.id)

    setFechando(false)
    carregarDados()
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const receitas = transacoesHoje.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
  const despesas = transacoesHoje.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
  const saldoAtual = (caixaHoje?.valor_inicial || 0) + receitas - despesas

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Caixa do Dia</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${caixaHoje?.status === 'aberto' ? 'bg-green-50 text-green-600' : caixaHoje?.status === 'fechado' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50 text-yellow-600'}`}>
          {caixaHoje?.status === 'aberto' ? 'Aberto' : caixaHoje?.status === 'fechado' ? 'Fechado' : 'Não iniciado'}
        </span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {!caixaHoje ? (
          <div className="card flex flex-col gap-4">
            <p className="font-bold text-gray-900">Abrir Caixa</p>
            <p className="text-sm text-gray-500">
              Informe o valor inicial em dinheiro no caixa
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Valor inicial (R$)
              </label>
              <input className="input-field" type="number" placeholder="0,00"
                value={valorInicial} onChange={e => setValorInicial(e.target.value)} />
            </div>
            <button onClick={abrirCaixa} disabled={!valorInicial || abrindo}
              className="btn-primary disabled:opacity-50"
              style={{ backgroundColor: cor }}>
              <Unlock size={18} />
              {abrindo ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-5" style={{ backgroundColor: cor }}>
              <p className="text-white/70 text-sm">Saldo Atual</p>
              <p className="text-white text-3xl font-bold mt-1">
                R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-white/60 text-xs mt-1">
                Valor inicial: R$ {caixaHoje.valor_inicial?.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-green-500" />
                  <p className="text-xs text-gray-400">Entradas</p>
                </div>
                <p className="text-lg font-bold text-green-500">
                  + R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown size={14} className="text-red-400" />
                  <p className="text-xs text-gray-400">Saídas</p>
                </div>
                <p className="text-lg font-bold text-red-400">
                  - R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {caixaHoje.status === 'aberto' && (
              <button onClick={fecharCaixa} disabled={fechando}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-medium text-sm disabled:opacity-50"
                style={{ borderColor: cor, color: cor }}>
                <Lock size={16} />
                {fechando ? 'Fechando...' : 'Fechar Caixa'}
              </button>
            )}

            {caixaHoje.status === 'fechado' && (
              <div className="card bg-gray-50">
                <p className="text-sm font-medium text-gray-700">Caixa fechado</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Valor final: R$ {caixaHoje.valor_final?.toFixed(2).replace('.', ',')}
                </p>
              </div>
            )}

            <p className="font-bold text-gray-900">Movimentações de hoje</p>
            {transacoesHoje.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400">Nenhuma movimentação hoje</p>
              </div>
            ) : (
              transacoesHoje.map(t => (
                <div key={t.id} className="card flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.tipo === 'receita' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {t.tipo === 'receita'
                      ? <TrendingUp size={16} className="text-green-500" />
                      : <TrendingDown size={16} className="text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.data_hora).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                      {t.forma_pagamento && ` • ${t.forma_pagamento.replace('_', ' ')}`}
                    </p>
                  </div>
                  <p className={`font-bold text-sm ${t.tipo === 'receita' ? 'text-green-500' : 'text-red-400'}`}>
                    {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
