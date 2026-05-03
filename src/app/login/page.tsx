'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, Scissors } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [erro, setErro] = useState('')

  // 🔥 REDIRECIONA SE JÁ ESTIVER LOGADO (SEM LOOP)
  useEffect(() => {
    if (loading) return

    if (profile) {
      if (profile.role === 'admin_central') {
        router.replace('/admin')
      } else if (profile.role === 'dono_salao') {
        router.replace('/salao')
      } else if (profile.role === 'funcionario') {
        router.replace('/funcionario')
      } else {
        router.replace('/cliente')
      }
    }
  }, [profile, loading])

  async function handleLogin() {
    if (!email || !senha) {
      setErro('Preencha email e senha.')
      return
    }

    setLoadingLogin(true)
    setErro('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })

    if (error) {
      setErro('Email ou senha incorretos.')
      setLoadingLogin(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, aprovado, ativo, salao_id')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      setErro('Perfil não encontrado.')
      setLoadingLogin(false)
      return
    }

    if (!profile.ativo) {
      await supabase.auth.signOut()
      setErro('Conta desativada.')
      setLoadingLogin(false)
      return
    }

    if (profile.role === 'admin_central') {
      router.replace('/admin')
      return
    }

    if (!profile.aprovado) {
      await supabase.auth.signOut()
      setErro('Aguardando aprovação.')
      setLoadingLogin(false)
      return
    }

    if (profile.role === 'dono_salao') {
      if (!profile.salao_id) {
        router.replace('/criar-salao')
        return
      }

      const { data: salao } = await supabase
        .from('saloes')
        .select('pausado, aprovado')
        .eq('id', profile.salao_id)
        .single()

      if (salao?.pausado) {
        await supabase.auth.signOut()
        setErro('Salão pausado.')
        setLoadingLogin(false)
        return
      }

      if (!salao?.aprovado) {
        await supabase.auth.signOut()
        setErro('Salão não aprovado.')
        setLoadingLogin(false)
        return
      }

      router.replace('/salao')
      return
    }

    if (profile.role === 'funcionario') {
      router.replace('/funcionario')
      return
    }

    router.replace('/cliente')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gray-900 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
          <Scissors size={30} className="text-gray-900" />
        </div>
        <h1 className="text-white text-2xl font-bold">Organiza Salão</h1>
        <p className="text-gray-400 text-sm mt-1">Bem-vinda de volta ✨</p>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-4 max-w-sm mx-auto w-full">

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative mt-1">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-11"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Senha</label>
          <div className="relative mt-1">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-11 pr-12"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2"
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {erro && (
          <div className="text-red-500 text-sm text-center">{erro}</div>
        )}

        <button className="btn-primary" onClick={handleLogin} disabled={loadingLogin}>
          {loadingLogin ? 'Entrando...' : 'Entrar'}
        </button>

      </div>
    </div>
  )
}
