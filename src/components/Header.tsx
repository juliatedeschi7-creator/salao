'use client'

import { Bell, LogOut, Menu, X, Home, Calendar, Users, BarChart2, Settings, Scissors, Package, FileText, UserCheck, Box, Bell as BellIcon, Sparkles, CreditCard } from 'lucide-react'
import { useNotificacoes } from '@/lib/hooks/useNotificacoes'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Profile } from '@/lib/supabase'

interface HeaderProps {
  profile: Profile
  salaoNome?: string
  corPrimaria?: string
  corSecundaria?: string
}

const MENU_DONO = [
  { icon: Home, label: 'Início', href: '/salao' },
  { icon: Calendar, label: 'Agenda', href: '/salao/agenda' },
  { icon: Users, label: 'Clientes', href: '/salao/clientes' },
  { icon: Scissors, label: 'Serviços', href: '/salao/servicos' },
  { icon: Package, label: 'Pacotes', href: '/salao/pacotes' },
  { icon: CreditCard, label: 'Pacotes por Cliente', href: '/salao/pacotes/clientes' },
  { icon: FileText, label: 'Anamnese', href: '/salao/anamnese' },
  { icon: UserCheck, label: 'Funcionários', href: '/salao/funcionarios' },
  { icon: Box, label: 'Estoque', href: '/salao/estoque' },
  { icon: BarChart2, label: 'Financeiro', href: '/salao/financeiro' },
  { icon: BellIcon, label: 'Notificações', href: '/salao/notificacoes' },
  { icon: Sparkles, label: 'Sugestões IA', href: '/salao/ia' },
  { icon: Settings, label: 'Configurações', href: '/salao/configuracoes' },
]

const MENU_ADMIN = [
  { icon: Home, label: 'Início', href: '/admin' },
  { icon: Users, label: 'Salões', href: '/admin/saloes' },
  { icon: UserCheck, label: 'Usuários', href: '/admin/usuarios' },
  { icon: BellIcon, label: 'Notificações', href: '/admin/notificacoes' },
]

export default function Header({ profile, salaoNome, corPrimaria = '#E91E8C', corSecundaria = '#FCE4F3' }: HeaderProps) {
  const { naoLidas, notificacoes, marcarComoLida, marcarTodasComoLidas } = useNotificacoes(profile.id)
  const [menuAberto, setMenuAberto] = useState(false)
  const [notifAberta, setNotifAberta] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const menuItems = profile.role === 'admin_geral' ? MENU_ADMIN : MENU_DONO

  function navegar(href: string) {
    setMenuAberto(false)
    router.push(href)
  }

  return (
    <>
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <button onClick={() => setMenuAberto(true)} className="p-1">
          <Menu size={22} className="text-gray-700" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-900 text-sm">
            {salaoNome || 'Organiza Salão'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotifAberta(!notifAberta)}
            className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell size={18} className="text-gray-600" />
            {naoLidas > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: corPrimaria }}>
                {naoLidas}
              </span>
            )}
          </button>

          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: corPrimaria }}>
            {profile.nome?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Painel de notificações */}
      {notifAberta && (
        <div className="fixed inset-0 z-50" onClick={() => setNotifAberta(false)}>
          <div
            className="absolute top-14 right-2 w-80 bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-bold text-gray-900">Notificações</span>
              {naoLidas > 0 && (
                <button onClick={marcarTodasComoLidas}
                  className="text-xs font-medium"
                  style={{ color: corPrimaria }}>
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  Nenhuma notificação
                </p>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} onClick={() => marcarComoLida(n.id)}
                    className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${!n.lida ? 'bg-pink-50' : ''}`}>
                    <div className="flex items-start gap-2">
                      {!n.lida && (
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: corPrimaria }} />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{n.titulo}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{n.mensagem}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(n.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu lateral */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-xl">
            {/* Header do menu */}
            <div className="p-5 flex items-center justify-between"
              style={{ backgroundColor: corPrimaria }}>
              <div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl mb-2">
                  {profile.nome?.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-bold">{profile.nome}</p>
                <p className="text-white/70 text-xs">{profile.email}</p>
                {salaoNome && (
                  <p className="text-white/80 text-xs mt-0.5">📍 {salaoNome}</p>
                )}
              </div>
              <button onClick={() => setMenuAberto(false)}
                className="text-white/70 self-start">
                <X size={20} />
              </button>
            </div>

            {/* Itens do menu */}
            <div className="flex-1 overflow-y-auto py-2">
              {menuItems.map(({ icon: Icon, label, href }) => {
                const ativo = pathname === href || pathname.startsWith(href + '/')
                return (
                  <button key={href} onClick={() => navegar(href)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all ${ativo ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={ativo ? { backgroundColor: corSecundaria, color: corPrimaria } : {}}>
                    <Icon size={18} />
                    <span className="text-sm">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Logout */}
            <button onClick={logout}
              className="flex items-center gap-3 px-5 py-4 text-gray-400 border-t hover:bg-gray-50">
              <LogOut size={18} />
              <span className="text-sm">Sair da conta</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
