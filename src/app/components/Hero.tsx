import { ArrowRight, BookOpen, Check, Layers3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#244438] bg-[#0b1715] pt-30 pb-10 sm:pt-36 sm:pb-14">
      <div aria-hidden="true" className="sf-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,transparent,#000)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:gap-16">
        <div className="max-w-2xl">
          <p className="sf-eyebrow mb-6 inline-flex items-center gap-3"><span className="h-2.5 w-2.5 rotate-45 bg-[#85ed65]" /> Software para servidores Minecraft</p>
          <h1 className="text-[clamp(3.15rem,6.4vw,6.8rem)] font-extrabold leading-[.99] tracking-[-.075em] text-white">
            Seu mundo.<br /><span className="text-[#85ed65]">Seu controle.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#c4d9ce] sm:text-lg">
            Plugins próprios, licenças organizadas e ferramentas para quem leva a experiência do servidor a sério.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/plugins" className="sf-button-primary">Explorar plugins <ArrowRight size={18} /></Link>
            <Link to="/docs" className="sf-button-secondary"><BookOpen size={18} /> Ler a documentação</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#3c5d4c] pt-6 text-sm text-[#d3e8d9]">
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#85ed65]" /> Feito para Minecraft</span>
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#85ed65]" /> Licenças na sua conta</span>
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#85ed65]" /> Suporte em um só lugar</span>
          </div>
        </div>

        <div className="relative isolate min-h-[490px] overflow-hidden rounded-[2rem] border border-[#b7f6c2]/55 bg-[linear-gradient(145deg,#c9f98b_0%,#81ebce_52%,#36bdb7_100%)] shadow-[0_28px_90px_rgba(0,0,0,.28)] sm:min-h-[560px]">
          <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-60" />
          <div aria-hidden="true" className="absolute -left-15 bottom-7 h-48 w-48 rotate-12 rounded-[2rem] border-[28px] border-[#074d46]/20" />
          <div aria-hidden="true" className="absolute right-8 top-10 h-18 w-18 rotate-12 bg-white/25" />
          <img src="/voxel/creator-avatar.webp" alt="Personagem voxel criado a partir de uma skin da comunidade, segurando um núcleo de servidor" className="absolute inset-x-0 bottom-0 mx-auto h-[95%] w-full object-contain object-bottom drop-shadow-[0_24px_26px_rgba(10,45,38,.3)]" fetchPriority="high" />
          <div className="absolute left-4 top-4 rounded-xl border border-white/20 bg-[#0d2726]/92 px-4 py-3 text-white shadow-xl backdrop-blur sm:left-6 sm:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9be9dc]">Starfin / ecossistema</p>
            <p className="mt-1 text-sm font-bold">Seu servidor tem identidade</p>
          </div>
          <div className="absolute bottom-5 right-4 flex max-w-[190px] items-center gap-2 rounded-xl border border-white/35 bg-white/94 px-3 py-2.5 text-xs font-bold text-[#12332b] shadow-xl sm:bottom-7 sm:right-7">
            <ShieldCheck size={20} className="shrink-0 text-[#157a4e]" /> Proteção e gestão sem complicar
          </div>
        </div>
      </div>
      <div className="relative mx-auto mt-13 grid max-w-7xl gap-3 px-5 sm:grid-cols-3 sm:px-8">
        {[
          { icon: ShieldCheck, title: 'Proteção', text: 'Ferramentas pensadas para a moderação.' },
          { icon: Layers3, title: 'Organização', text: 'Produtos e instalações em uma conta.' },
          { icon: BookOpen, title: 'Clareza', text: 'Documentação e suporte ao seu alcance.' }
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl border border-[#315548] bg-[#14241e] px-4 py-4">
            <Icon size={21} className="mt-0.5 shrink-0 text-[#85ed65]" />
            <div><strong className="block text-sm text-white">{title}</strong><span className="mt-1 block text-xs leading-5 text-[#b3cabd]">{text}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}
