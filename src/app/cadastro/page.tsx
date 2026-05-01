'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CadastroPage() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCadastro() {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          tipo: 'profissional'
        }
      }
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert('Conta criada! Aguarde aprovação.')
    router.push('/login')
  }

  return (
    <div style={styles.container}>
      
      {/* LOGO */}
      <img src="/logo.png" style={styles.logo} />

      <h1 style={styles.title}>Organiza Salão</h1>
      <p style={styles.subtitle}>
        Menos bagunça. Mais controle. Mais lucro.
      </p>

      <input
        placeholder="Seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleCadastro} style={styles.button}>
        {loading ? 'Criando...' : 'Criar conta'}
      </button>

      <p style={{ marginTop: 20 }}>
        Já tem conta? <a href="/login">Entrar</a>
      </p>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#fff'
  },
  logo: {
    width: 120,
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 700
  },
  subtitle: {
    marginBottom: 30,
    color: '#666'
  },
  input: {
    width: 280,
    padding: 12,
    marginBottom: 10,
    border: '1px solid #ccc',
    borderRadius: 8
  },
  button: {
    width: 280,
    padding: 12,
    background: '#000',
    color: '#fff',
    borderRadius: 8,
    border: 'none'
  }
}
