'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, Filter } from 'lucide-react'

export default function HistoricoEstoquePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [filtroProduto, setFiltroProduto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [produtos, setProdutos] = useState<any[]>([])

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: prods } = await supabase.from('produtos_estoque').select('id, nome')
      .eq('salao_id', profile!.salao_id!).order('nome')
    setProdutos(prods || [])

    const { data: movs } = await supabase
      .from('movimentacoes_estoque')
      .select('*, produtos_estoque(nome, unidade_medida), profiles(nome)')
      .eq('salao_id', profile!.salao_id!)
      .order('created_at', { ascending: false })
      .limit(100)
    setMovimentacoes(movs || [])
  }

  const cor = salao?.cor_primaria || '#E91E8C'

  const movsFiltradas = movimentacoes.filter(m => {
    const matchProduto = !filtroProduto || m.produto_id === filtroProduto
    const matchTipo = filtroTipo === 'todos' ? true :
      filtroTipo === 'entrada' ? m.tipo === 'entrada' : m.tipo !== 'entrada'
    return matchProduto && matchTipo
  })

  const motivoLabel: Record<string, string> = {
    compra: 'Compra',
    perda: 'Perda',
    descarte: 'Descarte',
    ajuste: 'Ajuste',
    servico_realizado: 'Serviço realizado',
  }

  return (
    <div className="min-h-screen bg-[#f8f4f6]">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Histórico de Estoque</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Filtros */}
        <div className="flex gap-2">
          {(['todos', 'entrada', 'saida'] as const).map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filtroTipo === f ? 'text-white' : 'bg-white text-gray-500'}`}
              style={filtroTipo === f ? { backgroundColor: cor } : {}}>
              {f === 'todos' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>

        <select className="input-field" value={filtroProduto}
          onChange={e => setFiltroProduto(e.target.value)}>
          <option value="">Todos os produtos</option>
          {produtos.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>

        <p className="text-xs text-gray-400">{movsFiltradas.length} movimentação(ões)</p>

        {movsFiltradas.length === 0 ? (
          <div className="card text-center py-10">
            <Filter size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          movsFiltradas.map(m => (
            <div key={m.id} className="card flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.tipo === 'entrada' ? 'bg-green-50' : 'bg-red-50'}`}>
                {m.tipo === 'entrada'
                  ? <TrendingUp size={18} className="text-green-500" />
                  : <TrendingDown size={18} className="text-red-400" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {m.produtos_estoque?.nome}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {motivoLabel[m.motivo] || m.motivo}
                  {m.profiles?.nome && ` • ${m.profiles.nome}`}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(m.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                {m.observacoes && (
                  <p className="text-xs text-gray-500 mt-0.5">{m.observacoes}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold ${m.tipo === 'entrada' ? 'text-green-500' : 'text-red-400'}`}>
                  {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}
                </p>
                <p className="text-xs text-gray-400">
                  {m.produtos_estoque?.unidade_medida}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
