import { SidebarProvider, SidebarTrigger, SidebarInset } from '../../components/ui/sidebar';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useAuth } from '../../lib/auth';
import { Link, Navigate, Outlet } from 'react-router';
import { Bell, ExternalLink } from 'lucide-react';

export function AdminLayout() {
  const { state } = useAuth();

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  if (state.user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#10141c] text-white">
        <AdminSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-white/10 bg-[#151a23]/95 px-5 backdrop-blur-lg sm:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white md:hidden"/>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#abb2fa]">StarfinPlugins</p>
                <span className="text-sm font-semibold text-white">Administração</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#b7bfcd] hover:text-white sm:inline-flex">Ver loja <ExternalLink size={13}/></Link>
              <Link to="/admin/notifications" className="rounded-lg border border-white/10 p-2.5 text-[#b7bfcd] hover:text-white" aria-label="Abrir notificações"><Bell size={18}/></Link>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#30384b] text-sm font-bold text-white" title={state.user.name}>{state.user.name?.[0]?.toUpperCase() || 'A'}</span>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
