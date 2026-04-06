import { Search, ShoppingCart, User, Menu, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { getPublicSettings } from '../lib/api';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const { count } = useCart();
  const [publicSettings, setPublicSettings] = useState<{ siteName: string; logoUrl: string | null } | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then((s) => setPublicSettings({ siteName: s.siteName, logoUrl: s.logoUrl }))
      .catch(() => null);
  }, []);

  const navItems = [
    { name: 'Início', to: '/' },
    { name: 'Plugins', to: '/plugins' },
    { name: 'Premium', to: '/premium' },
    { name: 'Documentação', to: '/docs' },
    { name: 'Suporte', to: '/support' },
  ];

  return (
    <>
      {state.status === 'authenticated' && !state.user.verified && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-600 text-white text-xs font-medium py-1 px-4 text-center">
          Por favor, verifique seu email para ativar todas as funcionalidades da sua conta.{' '}
          <button className="underline hover:no-underline font-bold ml-1">Reenviar email</button>
        </div>
      )}
      <nav className={`fixed ${state.status === 'authenticated' && !state.user.verified ? 'top-6' : 'top-0'} left-0 right-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-xl border-b border-[#7B2CBF]/20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              {publicSettings?.logoUrl ? (
                <img
                  src={publicSettings.logoUrl}
                  alt={publicSettings.siteName}
                  className="w-10 h-10 rounded-lg object-cover border border-[#7B2CBF]/30 shadow-lg shadow-[#7B2CBF]/20 group-hover:shadow-[#C77DFF]/40 transition-all duration-300"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF] rounded-lg flex items-center justify-center shadow-lg shadow-[#7B2CBF]/50 group-hover:shadow-[#C77DFF]/70 transition-all duration-300">
                  <div className="w-6 h-6 border-2 border-white/90 rounded-sm" style={{
                    backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 75%, transparent 75%), linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.3) 75%, transparent 75%)',
                    backgroundSize: '4px 4px',
                    backgroundPosition: '0 0, 2px 2px'
                  }}></div>
                </div>
              )}
              <div className="absolute inset-0 bg-[#C77DFF] rounded-lg blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#C77DFF] to-white bg-clip-text text-transparent">
              {publicSettings?.siteName || 'StarfinPlugins'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative text-sm transition-all duration-300 ${
                    isActive ? 'text-[#C77DFF]' : 'text-gray-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.name}
                    {isActive && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C77DFF] to-transparent"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="p-2 text-gray-300 hover:text-white hover:bg-[#1A1A22] rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#7B2CBF]/20 relative"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#7B2CBF] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
                  {count}
                </span>
              )}
            </button>
            {state.status === 'authenticated' ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => navigate('/account')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
                >
                  {state.user.plan === 'Premium' ? (
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm">{state.user.name}</span>
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 bg-transparent border border-[#7B2CBF]/40 text-white rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-sm"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Entrar</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-[#1A1A22] rounded-lg transition-all duration-300"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1A1A22] border-t border-[#7B2CBF]/20">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-[#7B2CBF]/20 text-[#C77DFF]'
                      : 'text-gray-300 hover:bg-[#7B2CBF]/10 hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            {state.status === 'authenticated' ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigate('/account');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
                >
                  Minha Conta
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-transparent border border-[#7B2CBF]/40 text-white rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
