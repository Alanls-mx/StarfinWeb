import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { Link } from 'react-router';
import { defaultHomeContent, type HomeContent } from '../lib/api';

export function Hero({ content = defaultHomeContent }: { content?: HomeContent }) {
  return (
    <section className="relative overflow-hidden border-b border-[#244438] bg-[#0b1715] pt-30 pb-10 sm:pt-36 sm:pb-14">
      <div aria-hidden="true" className="sf-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,transparent,#000)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:gap-16">
        <div className="max-w-2xl">
          <p className="sf-eyebrow mb-6 inline-flex items-center gap-3"><span className="h-2.5 w-2.5 rotate-45 bg-[#85ed65]" /> {content.heroEyebrow}</p>
          <h1 className="text-[clamp(3.15rem,6.4vw,6.8rem)] font-extrabold leading-[1.04] tracking-[-.035em] text-white">
            {content.heroTitle}<br /><span className="text-[#85ed65]">{content.heroAccent}</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#c4d9ce] sm:text-lg">
            {content.heroDescription}
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
          <div className="absolute bottom-5 right-4 rounded-lg border border-white/35 bg-[#0d2726]/92 px-4 py-3 font-mono text-xs text-[#c7f7e1] shadow-xl sm:bottom-7 sm:right-7">LICENÇAS · PLUGINS · SERVIDORES</div>
        </div>
      </div>
    </section>
  );
}
