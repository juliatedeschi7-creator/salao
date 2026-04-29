'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CadastroPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo: 'profissional'
          }
        }
      })

      if (error) {
        setErro(error.message)
        return
      }

      if (!data.user) {
        setErro('Erro ao criar usuário')
        return
      }

      // redireciona para login
      router.push('/login')

    } catch (err) {
      setErro('Erro inesperado ao criar conta')
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

        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>
          Criar conta
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: 20,
          fontSize: 14
        }}>
          Cadastre-se para acessar o sistema
        </p>

        <form
          onSubmit={handleCadastro}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid #ddd',
              fontSize: 14
            }}
          />

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
            placeholder="Senha"
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
            {loading ? 'Criando...' : 'Criar conta'}
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
          Já tem conta?{' '}
          <a href="/login" style={{ color: '#000', fontWeight: 600 }}>
            Entrar
          </a>
        </p>

      </div>
    </div>
  )
}