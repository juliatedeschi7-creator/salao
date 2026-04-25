import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.https://uhsvfbebjfeedpeznjnf.supabase.co!,
  process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoc3ZmYmViamZlZWRwZXpuam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDQ5MDUsImV4cCI6MjA5MjIyMDkwNX0.bBdB4l9mEw9jXlYVHEZ5tvaJIBYdjxtf6637QrUxjbw!
)

export async function GET() {
  try {
    const agora = new Date()

    const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
    const em24hFim = new Date(em24h.getTime() + 60 * 60 * 1000)
    const em2h = new Date(agora.getTime() + 2 * 60 * 60 * 1000)
    const em2hFim = new Date(em2h.getTime() + 60 * 60 * 1000)

    // Lembretes 24h
    const { data: ags24h } = await supabase
      .from('agendamentos')
      .select('id, salao_id, data_hora, clientes(nome, profile_id), servicos(nome), saloes(nome)')
      .eq('status', 'confirmado')
      .gte('data_hora', em24h.toISOString())
      .lte('data_hora', em24hFim.toISOString())

    for (const ag of (ags24h || []) as any[]) {
      const clienteProfileId = ag.clientes?.profile_id
      if (!clienteProfileId) continue

      const dataHora = new Date(ag.data_hora)
      await supabase.from('notificacoes').insert({
        salao_id: ag.salao_id,
        remetente_id: null,
        destinatario_id: clienteProfileId,
        titulo: '⏰ Lembrete de agendamento',
        mensagem: `Olá ${ag.clientes?.nome}! Você tem ${ag.servicos?.nome} amanhã às ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} no ${ag.saloes?.nome}.`,
        tipo: 'lembrete',
      })
    }

    // Lembretes 2h
    const { data: ags2h } = await supabase
      .from('agendamentos')
      .select('id, salao_id, data_hora, clientes(nome, profile_id), servicos(nome), saloes(nome)')
      .eq('status', 'confirmado')
      .gte('data_hora', em2h.toISOString())
      .lte('data_hora', em2hFim.toISOString())

    for (const ag of (ags2h || []) as any[]) {
      const clienteProfileId = ag.clientes?.profile_id
      if (!clienteProfileId) continue

      const dataHora = new Date(ag.data_hora)
      await supabase.from('notificacoes').insert({
        salao_id: ag.salao_id,
        remetente_id: null,
        destinatario_id: clienteProfileId,
        titulo: '🔔 Seu horário é em breve!',
        mensagem: `Lembrete: ${ag.servicos?.nome} em 2 horas (${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}) no ${ag.saloes?.nome}. Te esperamos! 💕`,
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
