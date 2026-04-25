'use client'

import { useMemo } from 'react'

// ======================
// Tipos
// ======================
type Receita = {
  valor: number
  categoria: string | null
  profissional: string | null
}

type Agrupamento = Record<string, number>

// ======================
// Página
// ======================
export default function RelatoriosPage() {
  // 🔹 Substitua depois pelos dados reais (Supabase, etc.)
  const receitas: Receita[] = []

  // ======================
  // 📊 Agrupar por categoria
  // ======================
  const receitasPorCategoria = useMemo<Agrupamento>(() => {
    return receitas.reduce((acc, item) => {
      const chave = item.categoria ?? 'Sem categoria'
      acc[chave] = (acc[chave] ?? 0) + item.valor
      return acc
    }, {} as Agrupamento)
  }, [receitas])

  // ======================
  // 👩‍💼 Agrupar por profissional
  // ======================
  const receitasPorProfissional = useMemo<Agrupamento>(() => {
    return receitas.reduce((acc, item) => {
      const chave = item.profissional ?? 'Sem profissional'
      acc[chave] = (acc[chave] ?? 0) + item.valor
      return acc
    }, {} as Agrupamento)
  }, [receitas])

  // ======================
  // 💰 Totais (CORRIGIDO 100%)
  // ======================
  const totalRec = useMemo(() => {
    const valores: number[] = Object.values(receitasPorCategoria)
    return valores.reduce((a, b) => a + b, 0) || 1
  }, [receitasPorCategoria])

  const totalProf = useMemo(() => {
    const valores: number[] = Object.values(receitasPorProfissional)
    return valores.reduce((a, b) => a + b, 0) || 1
  }, [receitasPorProfissional])

  // ======================
  // 📅 Período
  // ======================
  const periodoLabel = 'Este mês'

  // ======================
  // UI
  // ======================
  return (
    <div style={{ padding: 24 }}>
      <h1>Relatórios Financeiros</h1>

      <p>Período: {periodoLabel}</p>

      {/* ====================== */}
      {/* 📊 Categorias */}
      {/* ====================== */}
      <h2>Receitas por Categoria</h2>
      <ul>
        {Object.entries(receitasPorCategoria).map(([categoria, valor]) => (
          <li key={categoria}>
            {categoria}: R$ {valor.toFixed(2)}
          </li>
        ))}
      </ul>

      <p>
        <strong>Total:</strong> R$ {totalRec.toFixed(2)}
      </p>

      {/* ====================== */}
      {/* 👩‍💼 Profissionais */}
      {/* ====================== */}
      <h2>Receitas por Profissional</h2>
      <ul>
        {Object.entries(receitasPorProfissional).map(
          ([profissional, valor]) => (
            <li key={profissional}>
              {profissional}: R$ {valor.toFixed(2)}
            </li>
          )
        )}
      </ul>

      <p>
        <strong>Total:</strong> R$ {totalProf.toFixed(2)}
      </p>
    </div>
  )
}