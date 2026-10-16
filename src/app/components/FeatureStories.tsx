import { ArrowRight, KeyRound, Server } from 'lucide-react';
import { Link } from 'react-router';
import { defaultHomeContent, type HomeContent } from '../lib/api';

export function FeatureStories({ content = defaultHomeContent }: { content?: HomeContent }) {
  return <div>
    <section className="overflow-hidden bg-[#10261f] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:py-20">
        <div><p className="font-mono text-xs text-[#48c6bc]">SUA ÁREA / CONTROLE</p><h2 className="mt-4 max-w-xl text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">{content.accountTitle}</h2><p className="mt-5 max-w-xl leading-8 text-[#bdd2c5]">{content.accountDescription}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3 border-t border-white/20 pt-4 text-sm"><KeyRound className="text-[#85ed65]" size={20}/> Licenças e arquivos</div><div className="flex items-center gap-3 border-t border-white/20 pt-4 text-sm"><Server className="text-[#48c6bc]" size={20}/> Servidores e IPs</div></div><Link to="/account" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#a9f58e] hover:underline">Abrir minha conta <ArrowRight size={17}/></Link></div>
        <div className="relative h-[240px] sm:h-[320px] lg:h-[420px]"><img src={content.accountImageUrl || '/voxel/engineer.webp'} alt="Personagem ilustrando licenças e servidores" loading="lazy" className="absolute inset-0 h-full w-full object-contain object-bottom [mask-image:linear-gradient(to_bottom,#000_70%,transparent)] lg:object-cover lg:object-top" /></div>
      </div>
    </section>
    <section className="overflow-hidden bg-[#e4f2e7] text-[#11281c]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[.72fr_1fr] lg:py-20">
        <div className="relative order-2 h-[240px] sm:h-[320px] lg:order-none lg:h-[400px]"><img src={content.projectImageUrl || '/voxel/guardian.webp'} alt="Personagem associado ao projeto de moderação StarfinBans" loading="lazy" className="absolute inset-0 h-full w-full object-contain object-bottom" /></div>
        <div><p className="font-mono text-xs font-bold text-[#157251]">PROJETO EM DESENVOLVIMENTO / STARFINBANS</p><h2 className="mt-4 max-w-xl text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Moderação para o seu servidor.</h2><p className="mt-5 max-w-xl leading-8 text-[#456252]">StarfinBans é o projeto de gestão de punições da StarfinPlugins. O escudo representa proteção e controle da comunidade. Ainda não há JAR publicado nesta plataforma.</p><div className="mt-6 border-l-2 border-[#1a9b69] bg-white/70 p-4 text-sm text-[#456252]">Compatibilidade e documentação de instalação serão publicadas junto com a primeira versão.</div><Link to="/changelog" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#146942] hover:underline">Acompanhar atualizações <ArrowRight size={17}/></Link></div>
      </div>
    </section>
  </div>;
}
