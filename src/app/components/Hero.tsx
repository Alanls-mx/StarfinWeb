import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Layers3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

const projects = [
  { name: 'StarfinBans', description: 'Moderação e gerenciamento de punições', status: 'Em desenvolvimento', icon: ShieldCheck },
  { name: 'StarfinCore', description: 'Infraestrutura de licenciamento', status: 'Em desenvolvimento', icon: Layers3 }
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0d1118] pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{
        backgroundImage: 'linear-gradient(#6c7484 1px, transparent 1px), linear-gradient(90deg, #6c7484 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'linear-gradient(to right, transparent 18%, black 100%)'
      }} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:gap-20">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b9bcf6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a6acff]" />
            StarfinPlugins / Minecraft software
          </div>
          <h1 className="max-w-3xl text-[clamp(2.8rem,5.5vw,5.5rem)] font-semibold leading-[1.06] tracking-[-0.065em] text-[#f5f6fa]">
            Seu servidor merece software bem feito.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#a8afbd] sm:text-lg">
            Plugins desenvolvidos com foco em administração, estabilidade e uma experiência que faz sentido para quem mantém um servidor de Minecraft.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/plugins" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#b8bafb] px-6 text-sm font-semibold text-[#10121e] transition-colors hover:bg-[#d0d1ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8bafb]">
              Explorar plugins <ArrowRight size={17} />
            </Link>
            <Link to="/docs" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/20 bg-white/[.035] px-6 text-sm font-medium text-white transition-colors hover:bg-white/[.08]">
              <BookOpen size={16} /> Documentação
            </Link>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[#aeb5c1] sm:flex-row sm:gap-7">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-[#b9bcf6]"/> Documentação por produto</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-[#b9bcf6]"/> Gestão de licenças na conta</span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#171b25] shadow-[0_32px_100px_rgba(0,0,0,.32)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9ca4b6]">Starfin / workspace</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">Projetos em desenvolvimento</h2>
              </div>
              <span className="rounded-md border border-white/10 px-2 py-1 font-mono text-[11px] text-[#a7adbb]">2026</span>
            </div>
            <div className="divide-y divide-white/10">
              {projects.map((project) => {
                const Icon = project.icon;
                return (
                  <div key={project.name} className="flex gap-4 px-6 py-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#8d92cf]/20 bg-[#8d92cf]/10 text-[#c1c4ff]"><Icon size={20}/></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-white">{project.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[#9da6b6]">{project.description}</p>
                      <span className="mt-3 inline-flex rounded-md border border-[#b3b8d6]/20 bg-white/[.03] px-2.5 py-1 text-[11px] font-medium text-[#c3c7d4]">{project.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/plugins?search=StarfinBans" className="flex items-center justify-between border-t border-white/10 bg-white/[.025] px-6 py-4 text-sm font-medium text-[#d5d6ff] transition-colors hover:bg-white/[.06]">
              Conhecer o catálogo <ArrowUpRight size={17}/>
            </Link>
          </div>
          <div aria-hidden="true" className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border border-white/10" />
        </div>
      </div>
    </section>
  );
}
