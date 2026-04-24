'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'

function ResponderContent() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fichaId = searchParams.get('ficha')
  const clienteId = searchParams.get('cliente')

  const [salao, setSalao] = useState<any>(null)
  const [ficha, setFicha] = useState<any>(null)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    if (!loading && fichaId) carregarDados()
  }, [loading, fichaId])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: fich } = await supabase.from('fichas_anamnese').select('*')
      .eq('id', fichaId!).single()
    setFicha(fich)
  }

  async function handleSalvar() {
    if (!ficha || !clienteId) return
    const perguntas = ficha.perguntas as string[]
    const todasRespondidas = perguntas.every((_, i) => respostas[i]?.trim())
    if (!todasRespondidas) {
      alert('Por favor responda todas as perguntas.')
      return
    }

    setSalvando(true)

    const jaRespondeu = await supabase.from('respostas_anamnese')
      .select('id').eq('ficha_id', fichaId!).eq('cliente_id', clienteId!).single()

    if (jaRespondeu.data) {
      await supabase.from('respostas_anamnese').update({
        respostas,
        versao: ficha.versao,
        respondida_em: new Date().toISOString(),
      }).eq('id', jaRespondeu.data.id)
    } else {
      await supabase.from('respostas_anamnese').insert({
        ficha_id: fichaId,
        cliente_id: clienteId,
        versao: ficha.versao,
        respostas,
      })
    }

    setSalvando(false)
    setConcluido(true)
  }

  const cor = salao?.cor_primaria || '#E91E8C'

  if (concluido) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3' }}>
        <CheckCircle size={40} style={{ color: cor }} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Ficha respondida!</h2>
      <p className="text-gray-500">Suas respostas foram salvas com sucesso.</p>
      <button onClick={() => router.back()}
        className="btn-primary" style={{ backgroundColor: cor }}>
        Voltar
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f4f6]">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-lg">{ficha?.titulo}</h1>
          <p className="text-xs text-gray-400">{ficha?.categoria}</p>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 pb-8">
        {(ficha?.perguntas as string[] || []).map((pergunta, i) => (
          <div key={i} className="card flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {i + 1}. {pergunta}
            </label>
            <textarea className="input-field resize-none" rows={2}
              placeholder="Sua resposta..."
              value={respostas[i] || ''}
              onChange={e => setRespostas(prev => ({ ...prev, [i]: e.target.value }))} />
          </div>
        ))}

        <button onClick={handleSalvar} disabled={salvando}
          className="btn-primary mt-2"
          style={{ backgroundColor: cor }}>
          {salvando
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><CheckCircle size={18} />Salvar respostas</>}
        </button>
      </div>
    </div>
  )
}

export default function ResponderAnamnesePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResponderContent />
    </Suspense>
  )
}
