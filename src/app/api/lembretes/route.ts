import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

    const { data: ags24h } = await supabase
      .from('agendamentos')
      .select('*, clientes(nome, profile_id), servicos(nome), saloes(nome)')
      .in('status', ['confirmado'])
      .gte('data_hora', em24h.toISOString())
      .lte('data_hora', em24hFim.toISOString())

    for (const ag of ags24h || []) {
      if (!ag.clientes?.profile_id) continue

      const jaEnviou = await supabase
        .from('notificacoes')
        .select('id')
        .eq('destinatario_id', ag.clientes.profile_id)
        .eq('agendamento_id' as any, ag.id)
        .single()

      if (jaEnviou.data) continue

      const dataHora = new Date(ag.data_hora)
      await supabase.from('notificacoes').insert({
        salao_id: ag.salao_id,
        remetente_id: null,
        destinatario_id: ag.clientes.profile_id,
        titulo: '⏰ Lembrete de agendamento',
        mensagem: `Olá ${ag.clientes.nome}! Você tem ${ag.servicos?.nome} amanhã às ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} no ${ag.saloes?.nome}.`,
        tipo: 'lembrete',
      })
    }

    const { data: ags2h } = await supabase
      .from('agendamentos')
      .select('*, clientes(nome, profile_id), servicos(nome), saloes(nome)')
      .in('status', ['confirmado'])
      .gte('data_hora', em2h.toISOString())
      .lte('data_hora', em2hFim.toISOString())

    for (const ag of ags2h || []) {
      if (!ag.clientes?.profile_id) continue

      const dataHora = new Date(ag.data_hora)
      await supabase.from('notificacoes').insert({
        salao_id: ag.salao_id,
        remetente_id: null,
        destinatario_id: ag.clientes.profile_id,
        titulo: '🔔 Seu horário é em breve!',
        mensagem: `Lembrete: ${ag.servicos?.nome} em 2 horas (${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}) no ${ag.saloes?.nome}. Te esperamos!`,
        tipo: 'lembrete',
      })
    }

    return NextResponse.json({
      ok: true,
      lembretes24h: ags24h?.length || 0,
      lembretes2h: ags2h?.length || 0,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 })
  }
}
