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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setErro('Email ou senha inválidos')
        return
      }

      const user = data.user

      if (!user) {
        setErro('Erro ao obter usuário')
        return
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (erroPerfil || !perfil) {
        setErro('Perfil não encontrado')
        return
      }

      if (!perfil.aprovado) {
        setErro('Seu cadastro está aguardando aprovação')
        return
      }

      router.push('/salao')

    } catch (err) {
      setErro('Erro inesperado ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f5f5, #eaeaea)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#fff',
        padding: 28,
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        
        <h1 style={{
          textAlign: 'center',
          marginBottom: 8
        }}>
          Entrar
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: 20,
          fontSize: 14
        }}>
          Acesse sua conta do salão
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid #ddd',
              fontSize: 14
            }}
          />

          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid #ddd',
              fontSize: 14
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#000',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 6
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {erro && (
            <p style={{
              color: 'red',
              textAlign: 'center',
              fontSize: 13
            }}>
              {erro}
            </p>
          )}
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: 18,
          fontSize: 14
        }}>
          Não tem conta?{' '}
          <a href="/cadastro" style={{ color: '#000', fontWeight: 600 }}>
            Criar conta
          </a>
        </p>
      </div>
    </div>
  )
}