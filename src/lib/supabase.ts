import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin_geral' | 'dono_salao' | 'funcionario' | 'cliente'

export interface Profile {
  id: string
  email: string
  nome: string
  role: UserRole
  salao_id?: string
  avatar_url?: string
  aprovado: boolean
  ativo: boolean
  created_at: string
}

export interface Salao {
  id: string
  nome: string
  slug: string
  descricao?: string
  telefone?: string
  instagram?: string
  cidade?: string
  endereco?: string
  logo_url?: string
  dono_id: string
  cor_primaria: string
  cor_secundaria: string
  cor_texto: string
  ativo: boolean
  pausado: boolean
  motivo_pausa?: string
  horario_abertura: string
  horario_fechamento: string
  dias_funcionamento: string[]
  created_at: string
}
