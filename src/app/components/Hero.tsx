import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { Link } from 'react-router';
import { defaultHomeContent, type HomeContent } from '../lib/api';

export function Hero({ content = defaultHomeContent }: { content?: HomeContent }) {
  return (
    <section className="relative overflow-hidden border-b border-[#244438] bg-[#0b1715] pb-12 pt-28 sm:pb-16 sm:pt-32">
      <div aria-hidden="true" className="sf-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_right,transparent,#000)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-5 sm:px-8 lg:min-h-[510px] lg:grid-cols-[1.08fr_.92fr] lg:gap-4">
        <div className="max-w-2xl">
          <p className="sf-eyebrow mb-6 inline-flex items-center gap-3"><span className="h-2.5 w-2.5 rotate-45 bg-[#85ed65]" /> {content.heroEyebrow}</p>
          <h1 className="text-[clamp(3rem,5.2vw,5.6rem)] font-extrabold leading-[1.05] tracking-[-.035em] text-white">
            {content.heroTitle}<br /><span className="text-[#85ed65]">{content.heroAccent}</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#c4d9ce] sm:text-lg">
            {content.heroDescription}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={content.heroPrimaryHref || '/plugins'} className="sf-button-primary">{content.heroPrimaryLabel || 'Explorar plugins'} <ArrowRight size={18} /></Link>
            <Link to={content.heroSecondaryHref || '/docs'} className="sf-button-secondary"><BookOpen size={18} /> {content.heroSecondaryLabel || 'Ler a documentação'}</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#3c5d4c] pt-6 text-sm text-[#d3e8d9]">
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#85ed65]" /> Feito para Minecraft</span>
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#85ed65]" /> Licenças na sua conta</span>
            <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#85ed65]" /> Suporte em um só lugar</span>
          </div>
        </div>

        <div className="relative min-h-[390px] lg:h-full" aria-label="Personagem da comunidade StarfinPlugins">
          <div aria-hidden="true" className="absolute inset-8 rounded-full bg-[#48c6bc]/15 blur-3xl" />
          <img src={content.heroImageUrl || '/brand/main-character.png'} alt="Personagem principal da StarfinPlugins com coroa dourada" className="absolute inset-0 h-full w-full object-cover object-top" style={{ maskImage: 'radial-gradient(ellipse at 50% 45%, #000 60%, transparent 90%)' }} fetchPriority="high" />
          <div className="absolute bottom-3 right-0 border-l-2 border-[#48c6bc] bg-[#0b1715]/90 px-4 py-3 font-mono text-xs text-[#c7f7e1]">LICENÇAS · PLUGINS · SERVIDORES</div>
        </div>
      </div>
    </section>
  );
}
