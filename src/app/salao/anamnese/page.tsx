'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, FileText, Edit2, Send, CheckCircle } from 'lucide-react'

const CATEGORIAS = ['Manicure/Pedicure', 'Cabelo', 'Estética', 'Sobrancelha', 'Geral']

export default function AnamnesePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [fichas, setFichas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [respostas, setRespostas] = useState<any[]>([])
  const [modal, setModal] = useState<'criar' | 'enviar' | null>(null)
  const [fichaEditando, setFichaEditando] = useState<any>(null)
  const [fichaSelecionada, setFichaSelecionada] = useState<any>(null)
  const [form, setForm] = useState({
    titulo: '', categoria: 'Geral', perguntas: [''] as string[]
  })
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: fichs } = await supabase.from('fichas_anamnese').select('*')
      .eq('salao_id', profile!.salao_id!).order('created_at', { ascending: false })
    setFichas(fichs || [])

    const { data: clis } = await supabase.from('clientes').select('*, profiles(id)')
      .eq('salao_id', profile!.salao_id!).order('nome')
    setClientes(clis || [])

    const { data: resps } = await supabase.from('respostas_anamnese')
      .select('*, clientes(nome), fichas_anamnese(titulo)')
      .in('ficha_id', fichs?.map(f => f.id) || [])
      .order('respondida_em', { ascending: false })
    setRespostas(resps || [])
  }

  function abrirCriar(ficha?: any) {
    if (ficha) {
      setFichaEditando(ficha)
      setForm({
        titulo: ficha.titulo,
        categoria: ficha.categoria,
        perguntas: ficha.perguntas || ['']
      })
    } else {
      setFichaEditando(null)
      setForm({ titulo: '', categoria: 'Geral', perguntas: [''] })
    }
    setModal('criar')
  }

  async function salvarFicha() {
    if (!form.titulo || form.perguntas.filter(p => p.trim()).length === 0) return
    setSalvando(true)

    const perguntas = form.perguntas.filter(p => p.trim())

    if (fichaEditando) {
      await supabase.from('fichas_anamnese').update({
        titulo: form.titulo,
        categoria: form.categoria,
        perguntas,
        versao: fichaEditando.versao + 1,
      }).eq('id', fichaEditando.id)
    } else {
      await supabase.from('fichas_anamnese').insert({
        salao_id: profile!.salao_id,
        titulo: form.titulo,
        categoria: form.categoria,
        perguntas,
        versao: 1,
      })
    }

    setModal(null)
    setSalvando(false)
    carregarDados()
  }

  async function enviarFicha() {
    if (!fichaSelecionada || clientesSelecionados.length === 0) return
    setSalvando(true)

    const inserts = clientesSelecionados.map(cid => {
      const cliente = clientes.find(c => c.id === cid)
      return {
        salao_id: profile!.salao_id,
        remetente_id: profile!.id,
        destinatario_id: cliente?.profiles?.id,
        titulo: `Ficha de anamnese: ${fichaSelecionada.titulo}`,
        mensagem: `Por favor, responda a ficha de anamnese "${fichaSelecionada.titulo}".`,
        tipo: 'sistema'
      }
    }).filter(i => i.destinatario_id)

    if (inserts.length > 0) {
      await supabase.from('notificacoes').insert(inserts)
    }

    setModal(null)
    setClientesSelecionados([])
    setSalvando(false)
    alert(`Ficha enviada para ${inserts.length} cliente(s)!`)
  }

  function toggleCliente(id: string) {
    setClientesSelecionados(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const cor = salao?.cor_primaria || '#E91E8C'

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Anamnese</h1>
        <button onClick={() => abrirCriar()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: cor }}>
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <p className="text-sm font-bold text-gray-700">
          Fichas ({fichas.length})
        </p>

        {fichas.length === 0 ? (
          <div className="card text-center py-10">
            <FileText size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhuma ficha criada</p>
          </div>
        ) : (
          fichas.map(f => {
            const respostasFicha = respostas.filter(r => r.ficha_id === f.id)
            return (
              <div key={f.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{f.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {f.categoria} • v{f.versao} • {f.perguntas?.length || 0} perguntas
                    </p>
                    <p className="text-xs text-gray-400">
                      {respostasFicha.length} resposta(s)
                    </p>
                  </div>
                  <button onClick={() => abrirCriar(f)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Edit2 size={14} className="text-gray-500" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setFichaSelecionada(f); setClientesSelecionados([]); setModal('enviar') }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: cor }}>
                    <Send size={14} />Enviar para clientes
                  </button>
                </div>

                {respostasFicha.length > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">Respostas recentes:</p>
                    {respostasFicha.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-2 py-1">
                        <CheckCircle size={12} className="text-green-500" />
                        <p className="text-xs text-gray-600">{r.clientes?.nome}</p>
                        <p className="text-xs text-gray-400 ml-auto">
                          {new Date(r.respondida_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal criar ficha */}
      {modal === 'criar' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg">
              {fichaEditando ? 'Editar Ficha' : 'Nova Ficha'}
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Título</label>
              <input className="input-field" placeholder="Ex: Anamnese Capilar"
                value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Categoria</label>
              <select className="input-field" value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Perguntas</label>
              <div className="flex flex-col gap-2">
                {form.perguntas.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input-field flex-1" placeholder={`Pergunta ${i + 1}`}
                      value={p}
                      onChange={e => {
                        const novas = [...form.perguntas]
                        novas[i] = e.target.value
                        setForm(prev => ({ ...prev, perguntas: novas }))
                      }} />
                    {form.perguntas.length > 1 && (
                      <button onClick={() => setForm(prev => ({
                        ...prev,
                        perguntas: prev.perguntas.filter((_, pi) => pi !== i)
                      }))}
                        className="text-red-400 px-2">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setForm(prev => ({
                  ...prev, perguntas: [...prev.perguntas, '']
                }))}
                  className="text-sm font-medium py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                  + Adicionar pergunta
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={salvarFicha} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-white font-medium"
                style={{ backgroundColor: cor }}>
                {salvando ? '...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal enviar ficha */}
      {modal === 'enviar' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[80vh]">
            <h3 className="font-bold text-gray-900 text-lg">
              Enviar: {fichaSelecionada?.titulo}
            </h3>

            <p className="text-sm text-gray-500">
              Selecione as clientes que devem responder esta ficha:
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              <button onClick={() => setClientesSelecionados(
                clientesSelecionados.length === clientes.filter(c => c.profiles?.id).length
                  ? []
                  : clientes.filter(c => c.profiles?.id).map(c => c.id)
              )}
                className="text-sm font-medium py-2 text-left"
                style={{ color: cor }}>
                {clientesSelecionados.length === clientes.filter(c => c.profiles?.id).length
                  ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>

              {clientes.filter(c => c.profiles?.id).map(c => (
                <button key={c.id} onClick={() => toggleCliente(c.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${clientesSelecionados.includes(c.id) ? 'border-current' : 'border-gray-100 bg-gray-50'}`}
                  style={clientesSelecionados.includes(c.id) ? { borderColor: cor } : {}}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${clientesSelecionados.includes(c.id) ? 'border-current' : 'border-gray-300'}`}
                    style={clientesSelecionados.includes(c.id) ? { borderColor: cor, backgroundColor: cor } : {}}>
                    {clientesSelecionados.includes(c.id) && (
                      <CheckCircle size={12} className="text-white" />
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{c.nome}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={enviarFicha}
                disabled={clientesSelecionados.length === 0 || salvando}
                className="flex-1 py-3 rounded-2xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: cor }}>
                {salvando ? '...' : `Enviar (${clientesSelecionados.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
