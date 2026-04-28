'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Copy, Check, UserCheck, UserX } from 'lucide-react'

export default function FuncionariosPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [convites, setConvites] = useState<any[]>([])
  const [copiado, setCopiado] = useState(false)
  const [modalConfig, setModalConfig] = useState<any>(null)
  const [configForm, setConfigForm] = useState({
    tipo_contrato: 'autonomo',
    salario_base: '',
    comissao_percentual: '',
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: funcs } = await supabase
      .from('profiles')
      .select('*, profissionais(tipo_contrato, salario_base, comissao_percentual)')
      .eq('salao_id', profile!.salao_id!)
      .eq('role', 'funcionario')

    const { data: convs } = await supabase
      .from('convites')
      .select('*')
      .eq('salao_id', profile!.salao_id!)
      .eq('usado', false)
      .order('created_at', { ascending: false })

    setFuncionarios(funcs || [])
    setConvites(convs || [])
  }

  async function gerarConvite() {
    const { data } = await supabase.from('convites').insert({
      salao_id: profile!.salao_id,
      email: '',
      role: 'funcionario',
    }).select().single()

    if (data) carregarDados()
  }

function copiarLink(token: string) {
  const baseUrl = window.location.origin
  const link = `${baseUrl}/cadastro?token=${token}`
  navigator.clipboard.writeText(link)
  setCopiado(true)
  setTimeout(() => setCopiado(false), 2000)
}

  function abrirConfig(func: any) {
    setModalConfig(func)
    const prof = func.profissionais?.[0]
    setConfigForm({
      tipo_contrato: prof?.tipo_contrato || 'autonomo',
      salario_base: prof?.salario_base?.toString() || '',
      comissao_percentual: prof?.comissao_percentual?.toString() || '',
    })
  }

  async function salvarConfig() {
    if (!modalConfig) return
    setSalvando(true)

    const existe = modalConfig.profissionais?.[0]
    if (existe) {
      await supabase.from('profissionais').update({
        tipo_contrato: configForm.tipo_contrato,
        salario_base: parseFloat(configForm.salario_base || '0'),
        comissao_percentual: parseFloat(configForm.comissao_percentual || '0'),
      }).eq('profile_id', modalConfig.id).eq('salao_id', profile!.salao_id!)
    } else {
      await supabase.from('profissionais').insert({
        salao_id: profile!.salao_id,
        profile_id: modalConfig.id,
        tipo_contrato: configForm.tipo_contrato,
        salario_base: parseFloat(configForm.salario_base || '0'),
        comissao_percentual: parseFloat(configForm.comissao_percentual || '0'),
      })
    }

    setModalConfig(null)
    setSalvando(false)
    carregarDados()
  }

  async function removerFuncionario(id: string) {
    await supabase.from('profiles').update({
      salao_id: null, role: 'cliente', aprovado: false
    }).eq('id', id)
    carregarDados()
  }

  const cor = salao?.cor_primaria || '#E91E8C'

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-8">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Funcionários</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Link de convite */}
        <div className="card flex flex-col gap-3"
          style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3' }}>
          <p className="font-semibold text-sm" style={{ color: cor }}>
            🔗 Convidar funcionário
          </p>
          <p className="text-xs text-gray-500">
            Gere um link de convite. O funcionário precisará ser aprovado pelo administrador.
          </p>
          <button onClick={gerarConvite}
            className="py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: cor }}>
            Gerar novo link de convite
          </button>
        </div>

        {/* Convites pendentes */}
        {convites.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-gray-700">Links gerados</p>
            {convites.map(c => (
              <div key={c.id} className="card flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">
                    Gerado em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">
                    ...{c.token.slice(-12)}
                  </p>
                </div>
                <button onClick={() => copiarLink(c.token)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white"
                  style={{ backgroundColor: cor }}>
                  {copiado ? <><Check size={14} />Copiado</> : <><Copy size={14} />Copiar</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lista de funcionários */}
        <p className="text-sm font-bold text-gray-700">
          Equipe ({funcionarios.length})
        </p>

        {funcionarios.length === 0 ? (
          <div className="card text-center py-10">
            <Users size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum funcionário ainda</p>
          </div>
        ) : (
          funcionarios.map(f => {
            const prof = f.profissionais?.[0]
            return (
              <div key={f.id} className="card flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: cor }}>
                    {f.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{f.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.aprovado ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {f.aprovado ? 'Aprovado' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{f.email}</p>
                    {prof && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {prof.tipo_contrato === 'autonomo' ? 'Autônomo' :
                          prof.tipo_contrato === 'clt' ? 'CLT' : 'CLT + Comissão'}
                        {prof.comissao_percentual > 0 && ` • ${prof.comissao_percentual}% comissão`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => abrirConfig(f)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: salao?.cor_secundaria || '#FCE4F3', color: cor }}>
                    <UserCheck size={14} />Configurar
                  </button>
                  <button onClick={() => removerFuncionario(f.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-medium">
                    <UserX size={14} />Remover
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal configurar contrato */}
      {modalConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-gray-900 text-lg">
              Configurar — {modalConfig.nome}
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Tipo de contrato
              </label>
              <select className="input-field" value={configForm.tipo_contrato}
                onChange={e => setConfigForm(p => ({ ...p, tipo_contrato: e.target.value }))}>
                <option value="autonomo">Autônomo (CNPJ)</option>
                <option value="clt">CLT Fixo</option>
                <option value="clt_comissao">CLT + Comissão</option>
              </select>
            </div>

            {(configForm.tipo_contrato === 'clt' || configForm.tipo_contrato === 'clt_comissao') && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Salário base (R$)
                </label>
                <input className="input-field" type="number" placeholder="0,00"
                  value={configForm.salario_base}
                  onChange={e => setConfigForm(p => ({ ...p, salario_base: e.target.value }))} />
              </div>
            )}

            {(configForm.tipo_contrato === 'autonomo' || configForm.tipo_contrato === 'clt_comissao') && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Comissão (%)
                </label>
                <input className="input-field" type="number" placeholder="0"
                  value={configForm.comissao_percentual}
                  onChange={e => setConfigForm(p => ({ ...p, comissao_percentual: e.target.value }))} />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModalConfig(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium">
                Cancelar
              </button>
              <button onClick={salvarConfig} disabled={salvando}
                className="flex-1 py-3 rounded-2xl text-white font-medium"
                style={{ backgroundColor: cor }}>
                {salvando ? '...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
