import { ArrowRight, KeyRound, Server } from 'lucide-react';
import { Link } from 'react-router';
import { defaultHomeContent, type HomeContent } from '../lib/api';

export function FeatureStories({ content = defaultHomeContent }: { content?: HomeContent }) {
  return <div className="border-t border-white/10 bg-[#0d1d18] text-white">
    <section className="mx-auto grid max-w-7xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center">
      <div>
        <h2 className="max-w-xl text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">{content.accountTitle}</h2>
        <p className="mt-5 max-w-xl leading-8 text-[#bdd2c5]">{content.accountDescription}</p>
        <Link to="/account" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#a9f58e] hover:underline">Abrir minha conta <ArrowRight size={17} /></Link>
      </div>
      <div className="border-y border-white/15 font-mono text-sm">
        <div className="grid grid-cols-[34px_1fr] gap-4 border-b border-white/10 py-5"><KeyRound size={20} className="text-[#85ed65]" /><div><strong className="block text-white">Licenças</strong><span className="mt-1 block font-sans text-[#a9c1b8]">Consulte a chave principal e os produtos autorizados.</span></div></div>
        <div className="grid grid-cols-[34px_1fr] gap-4 border-b border-white/10 py-5"><Server size={20} className="text-[#85ed65]" /><div><strong className="block text-white">Servidores</strong><span className="mt-1 block font-sans text-[#a9c1b8]">Cadastre IPs e organize instalações na conta.</span></div></div>
        <div className="grid grid-cols-[34px_1fr] gap-4 py-5"><span className="text-[#85ed65]">{'>_'}</span><div><strong className="block text-white">Arquivos</strong><span className="mt-1 block font-sans text-[#a9c1b8]">Baixe versões publicadas quando houver licença ativa.</span></div></div>
      </div>
    </section>

    <section className="border-t border-white/10 bg-[#10251e]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div><h2 className="max-w-xl text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">StarfinBans está em desenvolvimento.</h2><p className="mt-5 max-w-xl leading-8 text-[#bdd2c5]">O projeto é voltado à moderação e à gestão de punições. Ainda não há um JAR publicado nesta plataforma.</p><Link to="/changelog" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#a9f58e] hover:underline">Acompanhar atualizações <ArrowRight size={17} /></Link></div>
        <div className="border border-white/15 bg-[#0b1715] p-5 font-mono text-sm shadow-[8px_8px_0_#183b2c]"><div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-[#9cb8a6]"><span>STARFINBANS</span><span>EM DESENVOLVIMENTO</span></div><p className="mt-6 text-[#bdd2c5]"><span className="text-[#85ed65]">produto</span> StarfinBans</p><p className="mt-3 text-[#bdd2c5]"><span className="text-[#85ed65]">área</span> moderação</p><p className="mt-3 text-[#bdd2c5]"><span className="text-[#85ed65]">arquivo</span> ainda não publicado</p><p className="mt-6 border-t border-white/10 pt-3 text-xs text-[#9cb8a6]">Detalhes de compatibilidade serão informados no lançamento.</p></div>
      </div>
    </section>
  </div>;
}
