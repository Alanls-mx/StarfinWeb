import { SidebarProvider, SidebarTrigger, SidebarInset } from '../../components/ui/sidebar';
import { AdminSidebar } from '../../components/AdminSidebar';
import { useAuth } from '../../lib/auth';
import { Navigate, Outlet, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Bell, Search } from 'lucide-react';

export function AdminLayout() {
  const { state } = useAuth();
  const navigate = useNavigate();

  // If not authenticated or not an admin, redirect to login
  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = state.user?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#0B0B0F] text-white">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1">
          {/* Header */}
          <header className="h-20 border-b border-[#7B2CBF]/10 flex items-center justify-between px-8 bg-[#0B0B0F]/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden text-white" />
              <div className="relative w-80 group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#C77DFF] transition-colors" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#1A1A22]/60 border border-[#7B2CBF]/10 rounded-xl text-sm text-white focus:border-[#7B2CBF]/50 outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/notifications')}
                className="p-2.5 rounded-xl bg-[#1A1A22]/60 border border-[#7B2CBF]/10 text-gray-400 hover:text-white hover:bg-[#7B2CBF]/10 transition-all relative"
                title="Abrir notificações"
                aria-label="Abrir notificações"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#7B2CBF] rounded-full border-2 border-[#13131A]"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-[#7B2CBF]/10">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{state.user?.name}</div>
                  <div className="text-[10px] font-bold text-[#C77DFF] uppercase tracking-wider">{state.user?.role || 'ADMINISTRADOR'}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center text-white font-bold shadow-lg shadow-[#7B2CBF]/20">
                  {state.user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
