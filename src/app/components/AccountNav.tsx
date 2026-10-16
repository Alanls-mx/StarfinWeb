import { NavLink } from 'react-router';

const entries = [
  ['Visão geral', '/account'], ['Meus plugins', '/account/plugins'], ['Licenças', '/account/licenses'],
  ['Servidores', '/account/servers'], ['Pedidos', '/account/orders'], ['Notificações', '/account/notifications'], ['Suporte', '/support'],
  ['Perfil e segurança', '/account/profile']
] as const;

export function AccountNav() {
  return <nav aria-label="Minha conta" className="flex flex-wrap gap-2 border-y border-white/15 py-4">
    {entries.map(([label, href]) => <NavLink key={href} to={href} end={href === '/account'} className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-[#85ed65] text-[#112516]' : 'text-[#bdd2c5] hover:bg-white/[.08] hover:text-white'}`}>{label}</NavLink>)}
  </nav>;
}
