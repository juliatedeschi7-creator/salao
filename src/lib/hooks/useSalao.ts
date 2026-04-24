'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Salao } from '../supabase'

export function useSalao(salaoId?: string) {
  const [salao, setSalao] = useState<Salao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (salaoId) buscarSalao(salaoId)
    else setLoading(false)
  }, [salaoId])

  async function buscarSalao(id: string) {
    const { data } = await supabase
      .from('saloes')
      .select('*')
      .eq('id', id)
      .single()
    setSalao(data)
    setLoading(false)
  }

  async function atualizarSalao(dados: Partial<Salao>) {
    if (!salaoId) return
    const { data } = await supabase
      .from('saloes')
      .update(dados)
      .eq('id', salaoId)
      .select()
      .single()
    setSalao(data)
    return data
  }

  return { salao, loading, atualizarSalao, recarregar: () => salaoId && buscarSalao(salaoId) }
}
