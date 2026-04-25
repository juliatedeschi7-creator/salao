'use client'

import { useMemo } from 'react'

type Receita = {
  valor: number
  categoria: string | null
  profissional: string | null
}

type Agrupamento = Record<string, number>

export default function RelatoriosPage() {
  const receitas: Receita[] = []

  const receitasPorCategoria: Agrupamento = useMemo(() => {
    return receitas.reduce<Agrupamento>((acc, item) => {
      const chave = item.categoria ?? 'Sem categoria'
      acc[chave] = (acc[chave] ?? 0) + item.valor
      return acc
    }, {})
  }, [receitas])

  const receitasPorProfissional: Agrupamento = useMemo(() => {
    return receitas.reduce<Agrupamento>((acc, item) => {
      const chave = item.profissional ?? 'Sem profissional'
      acc[chave] = (acc[chave] ?? 0) + item.valor
      return acc
    }, {})
  }, [receitas])

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

  const periodoLabel = 'Este mês'

  return (
    <div style={{ padding: 24 }}>
      <h1>Relatórios Financeiros</h1>

      <p>Período: {periodoLabel}</p>

      <h2>Receitas por Categoria</h2>
      <ul>
        {Object.entries(receitasPorCategoria).map(([cat, val]) => (
          <li key={cat}>
            {cat}: R$ {val.toFixed(2)}
          </li>
        ))}
      </ul>

      <p>Total: R$ {totalRec.toFixed(2)}</p>

      <h2>Receitas por Profissional</h2>
      <ul>
        {Object.entries(receitasPorProfissional).map(([prof, val]) => (
          <li key={prof}>
            {prof}: R$ {val.toFixed(2)}
          </li>
        ))}
      </ul>

      <p>Total: R$ {totalProf.toFixed(2)}</p>
    </div>
  )
}