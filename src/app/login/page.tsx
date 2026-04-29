'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    try {
      // 🔐 Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setErro('Email ou senha inválidos')
        setLoading(false)
        return
      }

      const user = data.user

      if (!user) {
        setErro('Erro ao obter usuário')
        setLoading(false)
        return
      }

      // 🔎 Buscar perfil
      const { data: perfil, error: erroPerfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (erroPerfil || !perfil) {
        setErro('Perfil não encontrado')
        setLoading(false)
        return
      }

      // ⏳ Aguardando aprovação
      if (!perfil.aprovado) {
        setErro('Seu cadastro está aguardando aprovação')
        setLoading(false)
        return
      }

      // ✅ Usuário aprovado → entra
      router.push('/salao')

    } catch (err) {
      setErro('Erro inesperado ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h1>Entrar</h1>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {erro && (
          <p style={{ color: 'red' }}>{erro}</p>
        )}
      </form>
    </div>
  )
}