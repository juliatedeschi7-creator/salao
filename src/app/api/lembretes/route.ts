'use client'

import { useMemo } from 'react'

// Tipos
type Receita = {
  valor: number
  categoria: string | null
  profissional: string | null
}

type Agrupamento = Record<string, number>

export default function RelatoriosPage() {
  // 🔹 Substitua isso pelos seus dados reais (ex: vindo do Supabase)
  const receitas: Receita[] = []

  // =========================
  // 📊 Agrupar por categoria
  // =========================
  const receitasPorCategoria: Agrupamento = useMemo(() => {
    return receitas.reduce<Agrupamento>((acc, item) => {
      const chave = item.categoria ?? 'Sem categoria'
      acc[chave] = (acc[chave] ?? 0) + item.valor
      return acc
    }, {})
  }, [receitas])

  // =========================
  // 👩‍💼 Agrupar por profissional
  // =========================
  const receitasPorProfissional: Agrupamento = useMemo(() => {
    return receitas.reduce<Agrupamento>((acc, item) => {
      const chave = item.profissional ?? 'Sem profissional'
      acc[chave] = (acc[chave] ?? 0) + item.valor
      return acc
    }, {})
  }, [receitas])

  // =========================
  // 💰 Totais (CORRIGIDO)
  // =========================
  const totalRec =
    Object.values(receitasPorCategoria).reduce(
      (a: number, b: number) => a + b,
      0
    ) || 1

  const totalProf =
    Object.values(receitasPorProfissional).reduce(
      (a: number, b: number) => a + b,
      0
    ) || 1

  // =========================
  // 📅 Label de período (exemplo)
  // =========================
  const periodoLabel = 'Este mês'

  return (
    <div style={{ padding: 24 }}>
      <h1>Relatórios Financeiros</h1>

      <p>Período: {periodoLabel}</p>

      {/* ========================= */}
      {/* 📊 Categorias */}
      {/* ========================= */}
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

      {/* ========================= */}
      {/* 👩‍💼 Profissionais */}
      {/* ========================= */}
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