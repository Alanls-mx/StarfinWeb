import { ArrowRight, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

const links = [
  { label: 'Início', href: '/' },
  { label: 'Plugins', href: '/plugins' },
  { label: 'Planos', href: '/premium' },
  { label: 'Documentação', href: '/docs' },
  { label: 'Suporte', href: '/support' }
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { state, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const verifiedWarning = state.status === 'authenticated' && !state.user.verified;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#315647] bg-[#0b1715]/95 text-white backdrop-blur-lg">
      {verifiedWarning && (
        <div className="border-b border-amber-300/15 bg-[#332b1d] px-4 py-2 text-center text-xs text-[#ffdda2]">
          Seu e-mail ainda não foi verificado. <Link to="/account" className="font-semibold underline underline-offset-2">Verificar na minha conta</Link>
        </div>
      )}
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="StarfinPlugins — início">
          <span aria-hidden="true" className="flex h-9 w-9 rotate-3 items-center justify-center rounded-lg border border-[#baf5a9] bg-[#85ed65] font-mono text-sm font-black text-[#123220] shadow-[3px_3px_0_#48c6bc]">SF</span>
          <span className="text-[17px] font-semibold tracking-[-0.035em]">StarfinPlugins</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {links.map((item) => (
            <NavLink key={item.href} to={item.href} end={item.href === '/'}
              className={({ isActive }) => `border-b-2 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'border-[#85ed65] text-[#a9f58e]' : 'border-transparent text-[#bed2c6] hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/cart')} aria-label={`Carrinho com ${count} itens`} className="relative rounded-lg p-2.5 text-[#d3ecdc] transition-colors hover:bg-white/[.1] hover:text-white">
            <ShoppingBag size={19} />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#85ed65] px-1 text-[10px] font-semibold text-[#102014]">{count}</span>}
          </button>
          {state.status === 'authenticated' ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/account" className="inline-flex items-center gap-2 rounded-lg border border-[#75b69a] px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/[.1]">
                <UserRound size={15}/><span className="max-w-28 truncate">{state.user.name}</span>
              </Link>
              <button type="button" onClick={logout} className="text-xs text-[#bed2c6] hover:text-white">Sair</button>
            </div>
          ) : (
            <Link to="/login" className="hidden items-center gap-2 rounded-lg bg-[#85ed65] px-4 py-2.5 text-xs font-extrabold text-[#112516] hover:bg-[#aaf394] sm:inline-flex">Entrar <ArrowRight size={14}/></Link>
          )}
          <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="starfin-mobile-nav" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} className="rounded-lg p-2.5 text-white hover:bg-white/[.07] lg:hidden">
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="starfin-mobile-nav" className="border-t border-[#315647] bg-[#10231d] px-5 py-4 lg:hidden" aria-label="Menu móvel">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((item) => (
              <NavLink key={item.href} to={item.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[#d0e7d8] hover:bg-white/[.08]">{item.label}</NavLink>
            ))}
            <Link to={state.status === 'authenticated' ? '/account' : '/login'} onClick={() => setMobileOpen(false)} className="mt-2 rounded-lg bg-[#85ed65] px-3 py-3 text-sm font-extrabold text-[#112516]">
              {state.status === 'authenticated' ? 'Minha conta' : 'Entrar ou criar conta'}
            </Link>
            {state.status === 'authenticated' && <button type="button" className="px-3 py-2 text-left text-sm text-[#aeb6c4]" onClick={() => { logout(); setMobileOpen(false); }}>Sair</button>}
          </div>
        </nav>
      )}
    </header>
  );
}
