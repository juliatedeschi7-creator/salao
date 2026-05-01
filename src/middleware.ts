import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 🔓 rotas públicas
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // 🔐 pegar usuário
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 🔎 buscar profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, aprovado')
    .eq('id', user.id)
    .single()

  // 🚨 PROTEÇÃO ADMIN
  if (pathname.startsWith('/gerenciar-usuarios')) {
    if (profile?.role !== 'admin_central') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}
