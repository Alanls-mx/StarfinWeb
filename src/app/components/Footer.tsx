import { ArrowUpRight, Mail } from 'lucide-react';
import { Link } from 'react-router';
import { useState, type FormEvent } from 'react';
import { subscribeNewsletter } from '../lib/api';

const groups = [
  { title: 'Produtos', links: [{ title: 'Catálogo', href: '/plugins' }, { title: 'Planos', href: '/premium' }, { title: 'Atualizações', href: '/changelog' }] },
  { title: 'Ajuda', links: [{ title: 'Documentação', href: '/docs' }, { title: 'Central de suporte', href: '/support' }, { title: 'Perguntas frequentes', href: '/faq' }] },
  { title: 'StarfinPlugins', links: [{ title: 'Sobre', href: '/about' }, { title: 'Contato', href: '/contact' }, { title: 'Status', href: '/status' }] },
  { title: 'Legal', links: [{ title: 'Termos de uso', href: '/terms' }, { title: 'Privacidade', href: '/privacy' }] }
];

export function Footer({ branding }: { branding: { siteName: string; logoUrl: string | null; footerText: string } }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setFeedback('');
    try {
      await subscribeNewsletter(email.trim());
      setEmail('');
      setFeedback('Inscrição realizada.');
    } catch {
      setFeedback('Não foi possível concluir a inscrição. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="border-t border-[#37694d] bg-[#0c1f19] text-[#b8d4c4]">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.15fr_1.85fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" /> : <span className="flex h-9 w-9 rotate-3 items-center justify-center rounded-lg bg-[#85ed65] font-mono text-sm font-black text-[#112516] shadow-[3px_3px_0_#48c6bc]">SF</span>}
              {branding.siteName}
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7">Desenvolvimento de plugins e ferramentas para servidores Minecraft. Produtos, atualizações e suporte em um só lugar.</p>
            <form onSubmit={subscribe} className="mt-7 max-w-sm">
              <label htmlFor="starfin-newsletter" className="mb-3 block text-sm font-semibold text-white">Novidades por e-mail</label>
              <div className="flex gap-2">
                <input id="starfin-newsletter" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail" className="min-w-0 flex-1 rounded-lg border border-[#547d66] bg-[#142d22] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#9abca5] focus:border-[#85ed65]"/>
                <button type="submit" disabled={sending} aria-label="Inscrever-se nas novidades" className="rounded-lg bg-[#85ed65] px-3.5 text-[#112516] disabled:opacity-60"><Mail size={18}/></button>
              </div>
              {feedback && <p aria-live="polite" className="mt-2 text-xs text-[#c1c4d0]">{feedback}</p>}
            </form>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-[.12em] text-white">{group.title}</h2>
                <ul className="space-y-3.5">
                  {group.links.map((link) => <li key={link.href}><Link to={link.href} className="text-sm leading-6 transition-colors hover:text-white">{link.title}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 pt-7 text-xs sm:flex-row sm:items-center">
          <span>{branding.footerText || `© ${new Date().getFullYear()} ${branding.siteName}. Todos os direitos reservados.`}</span>
          <a href="https://github.com/Alanls-mx/StarfinBans" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">StarfinBans no GitHub <ArrowUpRight size={13}/></a>
        </div>
      </div>
    </footer>
  );
}
