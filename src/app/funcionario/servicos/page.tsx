'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scissors } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { Home, Calendar, Users, BarChart2 } from 'lucide-react'

export default function FuncionarioServicosPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [salao, setSalao] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')

  useEffect(() => {
    if (!loading && profile?.salao_id) carregarDados()
  }, [loading])

  async function carregarDados() {
    const { data: sal } = await supabase.from('saloes').select('*')
      .eq('id', profile!.salao_id!).single()
    setSalao(sal)

    const { data: srvs } = await supabase.from('servicos').select('*')
      .eq('salao_id', profile!.salao_id!).eq('ativo', true).order('nome')
    setServicos(srvs || [])
  }

  const cor = salao?.cor_primaria || '#E91E8C'
  const categorias = ['Todos', ...Array.from(new Set(servicos.map(s => s.categoria)))]
  const servicosFiltrados = servicos.filter(s =>
    categoriaFiltro === 'Todos' || s.categoria === categoriaFiltro
  )

  const navItems = [
    { icon: Home, label: 'Início', href: '/funcionario' },
    { icon: Calendar, label: 'Agenda', href: '/funcionario/agenda' },
    { icon: Users, label: 'Clientes', href: '/funcionario/clientes' },
    { icon: Scissors, label: 'Serviços', href: '/funcionario/servicos' },
    { icon: BarChart2, label: 'Financeiro', href: '/funcionario/financeiro' },
  ]

  return (
    <div className="min-h-screen bg-[#f8f4f6] pb-20">
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">Serviços</h1>
        <span className="text-xs text-gray-400">somente leitura</span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map(c => (
            <button key={c} onClick={() => setCategoriaFiltro(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${categoriaFiltro === c ? 'text-white' : 'bg-white text-gray-500'}`}
              style={categoriaFiltro === c ? { backgroundColor: cor } : {}}>
              {c}
            </button>
          ))}
        </div>

        {servicosFiltrados.length === 0 ? (
          <div className="card text-center py-10">
            <Scissors size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Nenhum serviço</p>
          </div>
        ) : (
          servicosFiltrados.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{s.nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {s.categoria}
                    </span>
                  </div>
                  {s.descricao && (
                    <p className="text-sm text-gray-400 mt-0.5">{s.descricao}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-bold" style={{ color: cor }}>
                      R$ {s.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-gray-400">{s.duracao_minutos} min</span>
                    {s.comissao_percentual > 0 && (
                      <span className="text-xs text-gray-400">
                        Comissão: {s.comissao_percentual}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav items={navItems} corPrimaria={cor} />
    </div>
  )
}
