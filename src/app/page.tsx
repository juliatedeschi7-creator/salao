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
          role: 'profissional'
        }
      }
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert('Conta criada com sucesso! Faça login.')
    router.push('/login')
  }

  return (
    <div style={styles.container}>
      
      {/* LOGO */}
      <div style={styles.logoContainer}>
        <div style={styles.logoCircle}>
          ✂️
        </div>
        <h1 style={styles.title}>Organiza Salão</h1>
        <p style={styles.subtitle}>Seu negócio, organizado</p>
      </div>

      {/* FORM */}
      <div style={styles.form}>
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

        <p style={styles.linkText}>
          Já tem conta?{' '}
          <span onClick={() => router.push('/login')} style={styles.link}>
            Entrar
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },

  logoContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: 32,
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    border: '3px solid black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
  },

  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  form: {
    width: '100%',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },

  input: {
    padding: 12,
    border: '1px solid #ccc',
    borderRadius: 8,
    fontSize: 16,
  },

  button: {
    padding: 14,
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
  },

  linkText: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 10,
  },

  link: {
    cursor: 'pointer',
    fontWeight: 500,
    textDecoration: 'underline',
  },
}
