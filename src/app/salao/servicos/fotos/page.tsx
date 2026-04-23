'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Image } from 'lucide-react'
import { Suspense } from 'react'

function FotosContent() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const servicoId = searchParams.get('servico')
  const [salao, setSalao] = useState<any>(null)
  const [servico, setServico] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [url, setUrl] = useState('')
  const [descricao, setDescricao] = useState('')
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id && servicoId) carregarDados()
  }, [loading, servicoId])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: srv } = await supabase.from('servicos').select('*')
      .eq('id', servicoId!).single()
    setServico(srv)

    const { data: fts } = await supabase.from('fotos_servicos').select('*')
      .eq('servico_id', servicoId!).order('created_at', { ascending: false })
    setFotos(fts || [])
  }

  async function adicionarFoto() {
    if (!url) return
    setSalvando(true)

    await supabase.from('fotos_servicos').insert({
      salao_id: profile!.salao_id,
      servico_id: servicoId,
      url,
      descricao: descricao || null,
      adicionado_por: profile!.id,
    })

    setUrl('')
    setDescricao('')
    setModal(false)
    setSalvando(false)
    carregarDados()
  }

  async function excluirFoto(id: string) {
    await supabase.from('fotos_servicos').delete().eq('id', id)
    carregarDados()
  }

  const cor = salao?.cor_primaria || '#E91E8C'

  return (
    <div className="min-h-screen bg-[#f8f4f6]">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-lg">Fotos do Serviço</h1>
          {servico && <p className="text-xs text-gray-400">{servico.nome}</p>}
        </div>
        <button onClick={() => setModal(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: cor }}>
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="card" style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3' }}>
          <p className="text-sm font-medium" style={{ color: cor }}>
            📸 Dica: use links de imagens do Google Drive, Imgur ou qualquer URL pública de foto.
          </p>
        </div>

        {fotos.length === 0 ? (
          <div className="card text-center py-10">
            <Image size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhuma foto adicionada ainda</p>
            <button onClick={() => setModal(true)}
              className="mt-3 px-4 py-2 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: cor }}>
              + Adicionar foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {fotos.map(f => (
              <div key={f.id} className="relative rounded-2xl overflow-hidden bg-gray-100">
                <img src={f.url} alt={f.descricao || 'Foto'}
                  className="w-full h-40 object-cover" />
                {f.descricao && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                    <p className="text-white text-xs">{f.descricao}</p>
                  </div>
                )}
                <button onClick={() => excluirFoto(f.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Adicionar Foto</h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                URL da imagem
              </label>
              <input className="input-field" placeholder="https://..."
                value={url} onChange={e => setUrl(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Descrição (opcional)
              </label>
              <input className="input-field" placeholder="Ex: Mechas platinadas"
                value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>

            {url && (
              <div className="rounded-2xl overflow-hidden bg-gray-100">
                <img src={url} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModal(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={adicionarFoto} disabled={!url || salvando}
                className="flex-1 py-3 rounded-2xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: cor }}>
                {salvando ? '...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FotosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E91E8C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FotosContent />
    </Suspense>
  )
}
