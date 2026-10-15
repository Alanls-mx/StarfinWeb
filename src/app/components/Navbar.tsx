import { ArrowRight, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';
import { getPublicSettings } from '../lib/api';

const links = [
  { label: 'Início', href: '/' },
  { label: 'Plugins', href: '/plugins' },
  { label: 'Premium', href: '/premium' },
  { label: 'Documentação', href: '/docs' },
  { label: 'Suporte', href: '/support' }
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding, setBranding] = useState<{ siteName: string; logoUrl: string | null } | null>(null);
  const { state, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getPublicSettings()
      .then((value) => setBranding({ siteName: value.siteName, logoUrl: value.logoUrl }))
      .catch(() => {});
  }, []);

  const verifiedWarning = state.status === 'authenticated' && !state.user.verified;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#10141c]/95 text-white backdrop-blur-lg">
      {verifiedWarning && (
        <div className="border-b border-amber-300/15 bg-[#332b1d] px-4 py-2 text-center text-xs text-[#ffdda2]">
          Seu e-mail ainda não foi verificado. <Link to="/account" className="font-semibold underline underline-offset-2">Verificar na minha conta</Link>
        </div>
      )}
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="StarfinPlugins — início">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#aaaefb]/35 bg-[#858bdd]/15 font-mono text-sm font-bold text-[#c5c7ff]">SF</span>
          )}
          <span className="text-[17px] font-semibold tracking-[-0.035em]">{branding?.siteName || 'StarfinPlugins'}</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {links.map((item) => (
            <NavLink key={item.href} to={item.href} end={item.href === '/'}
              className={({ isActive }) => `text-[13px] font-medium transition-colors ${isActive ? 'text-[#c5c7ff]' : 'text-[#aeb6c4] hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/cart')} aria-label={`Carrinho com ${count} itens`} className="relative rounded-lg p-2.5 text-[#b6bfcd] transition-colors hover:bg-white/[.07] hover:text-white">
            <ShoppingBag size={19} />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5c7ff] px-1 text-[10px] font-semibold text-[#151727]">{count}</span>}
          </button>
          {state.status === 'authenticated' ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/account" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/[.07]">
                <UserRound size={15}/><span className="max-w-28 truncate">{state.user.name}</span>
              </Link>
              <button type="button" onClick={logout} className="text-xs text-[#aeb6c4] hover:text-white">Sair</button>
            </div>
          ) : (
            <Link to="/login" className="hidden items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold hover:bg-white/[.07] sm:inline-flex">Entrar <ArrowRight size={14}/></Link>
          )}
          <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="starfin-mobile-nav" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} className="rounded-lg p-2.5 text-white hover:bg-white/[.07] lg:hidden">
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="starfin-mobile-nav" className="border-t border-white/10 bg-[#151a24] px-5 py-4 lg:hidden" aria-label="Menu móvel">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((item) => (
              <NavLink key={item.href} to={item.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[#c4cbd5] hover:bg-white/[.06]">{item.label}</NavLink>
            ))}
            <Link to={state.status === 'authenticated' ? '/account' : '/login'} onClick={() => setMobileOpen(false)} className="mt-2 rounded-lg border border-white/15 px-3 py-3 text-sm font-semibold text-white">
              {state.status === 'authenticated' ? 'Minha conta' : 'Entrar ou criar conta'}
            </Link>
            {state.status === 'authenticated' && <button type="button" className="px-3 py-2 text-left text-sm text-[#aeb6c4]" onClick={() => { logout(); setMobileOpen(false); }}>Sair</button>}
          </div>
        </nav>
      )}
    </header>
  );
}
