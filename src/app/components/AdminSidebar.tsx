import { Activity, Bell, BookOpen, Boxes, Briefcase, CreditCard, FileText, Gift, LayoutDashboard, Link2, ListOrdered, LogOut, Mail, MessageSquare, ScrollText, Settings, ShoppingBag, Ticket, Users } from 'lucide-react';
import { NavLink } from 'react-router';
import { useAuth } from '../lib/auth';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from './ui/sidebar';

const groups = [
  { label: 'Visão geral', links: [{ to: '/admin', label: 'Painel', icon: LayoutDashboard }] },
  { label: 'Comercial', links: [
    { to: '/admin/plugins', label: 'Plugins', icon: Boxes },
    { to: '/admin/categories', label: 'Categorias', icon: ListOrdered },
    { to: '/admin/purchases', label: 'Pedidos e compras', icon: ShoppingBag },
    { to: '/admin/plans', label: 'Planos', icon: CreditCard },
    { to: '/admin/coupons', label: 'Cupons', icon: Ticket },
    { to: '/admin/raffles', label: 'Sorteios', icon: Gift }
  ] },
  { label: 'Clientes', links: [
    { to: '/admin/users', label: 'Usuários', icon: Users },
    { to: '/admin/support', label: 'Suporte', icon: MessageSquare },
    { to: '/admin/reviews', label: 'Avaliações', icon: Bell }
  ] },
  { label: 'Conteúdo', links: [
    { to: '/admin/content', label: 'Conteúdo do site', icon: Briefcase },
    { to: '/admin/docs', label: 'Documentação', icon: BookOpen },
    { to: '/admin/changelog', label: 'Changelog', icon: ScrollText },
    { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    { to: '/admin/notifications', label: 'Notificações', icon: FileText }
  ] },
  { label: 'Sistema', links: [
    { to: '/admin/integrations', label: 'Integrações', icon: Link2 },
    { to: '/admin/smtp', label: 'E-mail', icon: Mail },
    { to: '/admin/status', label: 'Status', icon: Activity },
    { to: '/admin/settings', label: 'Configurações', icon: Settings }
  ] }
];

export function AdminSidebar() {
  const { logout } = useAuth();
  return <Sidebar className="border-r border-white/10 bg-[#151a23] text-white">
    <SidebarHeader className="border-b border-white/10 px-5 py-6">
      <NavLink to="/admin" className="flex items-center gap-3" aria-label="Painel StarfinPlugins">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">S</span>
        <span><strong className="block text-sm tracking-tight">StarfinPlugins</strong><small className="text-xs text-muted-foreground">Administração</small></span>
      </NavLink>
    </SidebarHeader>
    <SidebarContent className="space-y-6 overflow-y-auto px-3 py-5">
      {groups.map(group => <nav key={group.label} aria-label={group.label}>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-[#8994a8]">{group.label}</p>
        <ul className="space-y-0.5">{group.links.map(item => <li key={item.to}><NavLink to={item.to} end={item.to === '/admin'} className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${isActive ? 'bg-primary/15 font-semibold text-[#d3d4ff]' : 'text-[#abb5c4] hover:bg-white/[.05] hover:text-white'}`}><item.icon size={17} strokeWidth={1.8}/>{item.label}</NavLink></li>)}</ul>
      </nav>)}
    </SidebarContent>
    <SidebarFooter className="border-t border-white/10 p-4">
      <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#abb5c4] hover:bg-white/[.05] hover:text-white"><LogOut size={17}/> Sair</button>
    </SidebarFooter>
  </Sidebar>;
}
