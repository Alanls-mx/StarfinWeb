import {
  Activity,
  AtSign,
  Bell,
  Boxes,
  Briefcase,
  CreditCard,
  FileText,
  Hammer,
  Home,
  LayoutDashboard,
  Link2,
  ListOrdered,
  LogOut,
  Mail,
  MessageSquare,
  ScrollText,
  Settings,
  ShoppingBag,
  Ticket,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from './ui/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from './ui/sidebar';
import { useAuth } from '../lib/auth';
import { getPublicSettings } from '../lib/api';

const adminItems = [
  { to: '/admin', icon: LayoutDashboard, title: 'Dashboard' },
  { to: '/admin/users', icon: Users, title: 'Usuarios' },
  { to: '/admin/plugins', icon: Hammer, title: 'Plugins' },
  { to: '/admin/categories', icon: ListOrdered, title: 'Categorias' },
  { to: '/admin/docs', icon: FileText, title: 'Documentacao' },
  { to: '/admin/content', icon: Briefcase, title: 'Conteudo' },
  { to: '/admin/support', icon: Boxes, title: 'Suporte' },
  { to: '/admin/purchases', icon: ShoppingBag, title: 'Compras' },
  { to: '/admin/notifications', icon: Bell, title: 'Notificacoes' },
  { to: '/admin/coupons', icon: Ticket, title: 'Cupons' },
  { to: '/admin/newsletter', icon: Mail, title: 'Newsletter' },
  { to: '/admin/plans', icon: CreditCard, title: 'Planos' },
  { to: '/admin/reviews', icon: MessageSquare, title: 'Avaliacoes' }
];

const systemItems = [
  { to: '/admin/smtp', icon: AtSign, title: 'SMTP' },
  { to: '/admin/integrations', icon: Link2, title: 'Integracoes' },
  { to: '/admin/status', icon: Activity, title: 'Status Page' },
  { to: '/admin/changelog', icon: ScrollText, title: 'Changelog' },
  { to: '/admin/settings', icon: Settings, title: 'Configuracoes' }
];

export function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [publicSettings, setPublicSettings] = useState<{ siteName: string; logoUrl: string | null } | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then((s) => setPublicSettings({ siteName: s.siteName, logoUrl: s.logoUrl }))
      .catch(() => null);
  }, []);

  return (
    <Sidebar className="border-r border-[#7B2CBF]/20 bg-[#0B0B0F]">
      <SidebarHeader className="p-6 border-b border-[#7B2CBF]/10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            {publicSettings?.logoUrl ? (
              <img
                src={publicSettings.logoUrl}
                alt={publicSettings.siteName}
                className="w-10 h-10 rounded-xl object-cover border border-[#7B2CBF]/30 shadow-lg shadow-[#7B2CBF]/20 group-hover:scale-110 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center shadow-lg shadow-[#7B2CBF]/20 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            )}
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {publicSettings?.siteName || 'Starfin'} Admin
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Gestao
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl transition-all duration-200 group',
                      location.pathname === item.to
                        ? 'bg-[#7B2CBF]/20 text-[#C77DFF]'
                        : 'text-gray-400 hover:bg-[#7B2CBF]/10 hover:text-white'
                    )}
                  >
                    <Link to={item.to} className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'w-5 h-5',
                          location.pathname === item.to ? 'text-[#C77DFF]' : 'text-gray-500 group-hover:text-gray-300'
                        )}
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl transition-all duration-200 group',
                      location.pathname === item.to
                        ? 'bg-[#7B2CBF]/20 text-[#C77DFF]'
                        : 'text-gray-400 hover:bg-[#7B2CBF]/10 hover:text-white'
                    )}
                  >
                    <Link to={item.to} className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'w-5 h-5',
                          location.pathname === item.to ? 'text-[#C77DFF]' : 'text-gray-500 group-hover:text-gray-300'
                        )}
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#7B2CBF]/10 space-y-2">
        <SidebarMenuButton
          asChild
          className="w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-[#7B2CBF]/10 hover:text-white transition-all group"
        >
          <Link to="/" className="flex items-center gap-3">
            <Home className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
            <span className="font-medium">Voltar ao Site</span>
          </Link>
        </SidebarMenuButton>
        <button
          onClick={logout}
          className="w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3 group"
        >
          <LogOut className="w-5 h-5 text-red-400/70 group-hover:text-red-400" />
          <span className="font-medium">Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
