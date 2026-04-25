import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Tipos
type Cliente = {
  nome: string | null
  profile_id: string | null
}

type Servico = {
  nome: string | null
}

type Salao = {
  nome: string | null
}

type Agendamento = {
  id: string
  salao_id: string
  data_hora: string
  clientes: Cliente[] | null
  servicos: Servico[] | null
  saloes: Salao[] | null
}

// Supabase client (server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const agora = new Date()

    const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
    const em24hFim = new Date(em24h.getTime() + 60 * 60 * 1000)

    const em2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000)
    const em2hFim = new Date(em2h.getTime() + 60 * 60 * 1000)

    // ===== 24h =====
    const { data: ags24h } = await supabase
      .from('agendamentos')
      .select(`
        id,
        salao_id,
        data_hora,
        clientes ( nome, profile_id ),
        servicos ( nome ),
        saloes ( nome )
      `)
      .eq('status', 'confirmado')
      .gte('data_hora', em24h.toISOString())
      .lte('data_hora', em24hFim.toISOString())

    const lista24h = (ags24h ?? []) as Agendamento[]

    for (const ag of lista24h) {
      const cliente = ag.clientes?.[0]
      const servico = ag.servicos?.[0]
      const salao = ag.saloes?.[0]

      const clienteProfileId = cliente?.profile_id
      if (!clienteProfileId) continue

      const dataHora = new Date(ag.data_hora)

      await supabase.from('notificacoes').insert({
        salao_id: ag.salao_id,
        remetente_id: null,
        destinatario_id: clienteProfileId,
        titulo: '⏰ Lembrete de agendamento',
        mensagem: `Olá ${cliente?.nome ?? ''}! Você tem ${
          servico?.nome ?? ''
        } amanhã às ${dataHora.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })} no ${salao?.nome ?? ''}.`,
        tipo: 'lembrete',
      })
    }

    // ===== 2h =====
    const { data: ags2h } = await supabase
      .from('agendamentos')
      .select(`
        id,
        salao_id,
        data_hora,
        clientes ( nome, profile_id ),
        servicos ( nome ),
        saloes ( nome )
      `)
      .eq('status', 'confirmado')
      .gte('data_hora', em2h.toISOString())
      .lte('data_hora', em2hFim.toISOString())

    const lista2h = (ags2h ?? []) as Agendamento[]

    for (const ag of lista2h) {
      const cliente = ag.clientes?.[0]
      const servico = ag.servicos?.[0]
      const salao = ag.saloes?.[0]

      const clienteProfileId = cliente?.profile_id
      if (!clienteProfileId) continue

      const dataHora = new Date(ag.data_hora)

      await supabase.from('notificacoes').insert({
        salao_id: ag.salao_id,
        remetente_id: null,
        destinatario_id: clienteProfileId,
        titulo: '🔔 Seu horário é em breve!',
        mensagem: `Lembrete: ${servico?.nome ?? ''} em 2 horas (${dataHora.toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        )}) no ${salao?.nome ?? ''}. Te esperamos! 💕`,
        tipo: 'lembrete',
      })
    }

    return NextResponse.json({
      ok: true,
      lembretes24h: lista24h.length,
      lembretes2h: lista2h.length,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        erro: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}