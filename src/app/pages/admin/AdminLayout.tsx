import { SidebarProvider, SidebarTrigger, SidebarInset } from '../../components/ui/sidebar';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useAuth } from '../../lib/auth';
import { Link, Navigate, Outlet } from 'react-router';
import { ExternalLink } from 'lucide-react';

export function AdminLayout() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b1715] text-[#bed2c6]" role="status">Verificando acesso administrativo...</div>;
  }
  if (state.status === 'anonymous') {
    return <Navigate to="/login?next=%2Fadmin" replace />;
  }
  if (state.user?.role !== 'admin') {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b1715] px-5 text-center text-white"><h1 className="text-2xl font-bold">Acesso restrito</h1><p className="max-w-md text-sm text-[#bed2c6]">Sua conta não tem permissão para acessar o painel administrativo.</p><Link to="/account" className="rounded-lg bg-[#85ed65] px-4 py-2 text-sm font-bold text-[#112516]">Voltar à minha conta</Link></main>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#0b1715] text-white">
        <AdminSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-[#335844] bg-[#10231d]/95 px-5 backdrop-blur-lg sm:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white md:hidden"/>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#85ed65]">StarfinPlugins</p>
                <span className="text-sm font-semibold text-white">Administração</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#b7bfcd] hover:text-white sm:inline-flex">Ver loja <ExternalLink size={13}/></Link>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#85ed65] text-sm font-bold text-[#112516]" title={state.user.name}>{state.user.name?.[0]?.toUpperCase() || 'A'}</span>
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
