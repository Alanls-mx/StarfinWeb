import { ArrowRight, BookOpen, KeyRound, Server, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

export function FeatureStories() {
  return (
    <div>
      <section className="bg-[#f4f8ef] px-5 py-20 text-[#12251d] sm:px-8 sm:py-26">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div className="relative order-2 min-h-[370px] overflow-hidden rounded-[2rem] bg-[#d5f4d9] lg:order-1 lg:min-h-[470px]">
            <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-70" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-15 h-65 w-65 rotate-12 rounded-[3rem] bg-[#b7edc7]" />
            <img src="/voxel/engineer.webp" alt="Personagem voxel apresentando um núcleo de servidor e um escudo" loading="lazy" className="absolute inset-x-0 bottom-0 mx-auto h-[105%] w-full object-contain object-bottom" />
            <span className="absolute bottom-5 left-5 rounded-lg bg-[#10362d] px-3 py-2 text-xs font-bold text-white">Licenças + instalações</span>
          </div>
          <div className="order-1 lg:order-2">
            <p className="sf-eyebrow !text-[#14775a]">Mais controle, menos confusão</p>
            <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-.055em] sm:text-5xl">Tudo o que é seu, em um só lugar.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#455e51]">A área da conta reúne suas licenças, plugins, servidores e pedidos. Encontre o que precisa sem procurar em mensagens antigas.</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              <li className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold"><KeyRound size={19} className="text-[#159965]" /> Consulte suas licenças</li>
              <li className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold"><Server size={19} className="text-[#159965]" /> Organize servidores</li>
            </ul>
            <Link to="/account" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-[#096843] hover:underline">Conhecer minha conta <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#10332c] px-5 py-20 text-white sm:px-8 sm:py-26">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <div>
            <p className="sf-eyebrow">Na forja / StarfinBans</p>
            <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-.055em] sm:text-5xl">Proteção que fala a língua do seu servidor.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#c2dfd3]">StarfinBans está em desenvolvimento para apoiar a moderação e a gestão de punições. Acompanhe as novidades antes do lançamento.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#a6eea1]/35 bg-[#a6eea1]/10 px-4 py-2 text-xs font-bold text-[#b1f6ac]"><ShieldCheck size={16} /> Em desenvolvimento</span>
              <Link to="/changelog" className="sf-button-secondary">Acompanhar atualizações <ArrowRight size={17} /></Link>
            </div>
          </div>
          <div className="relative min-h-[370px] overflow-hidden rounded-[2rem] bg-[linear-gradient(140deg,#71dec2,#b9f183)] lg:min-h-[470px]">
            <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-60" />
            <img src="/voxel/guardian.webp" alt="Guardião voxel com escudo simbolizando a moderação do StarfinBans" loading="lazy" className="absolute inset-x-0 bottom-0 mx-auto h-[105%] w-full object-contain object-bottom" />
            <span className="absolute right-5 top-5 rounded-lg bg-[#10332c] px-3 py-2 text-xs font-bold text-white">Moderação em foco</span>
          </div>
        </div>
      </section>

      <section className="border-t border-[#ddeddf] bg-white px-5 py-18 text-[#13251d] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
          <div><p className="sf-eyebrow !text-[#15866b]">Pronto para explorar?</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Seu próximo passo começa aqui.</h2><p className="mt-2 text-sm leading-7 text-[#547063]">Conheça os produtos publicados e encontre guias para configurar seu servidor.</p></div>
          <div className="flex flex-wrap gap-3"><Link to="/plugins" className="sf-button-primary">Ver catálogo <ArrowRight size={17} /></Link><Link to="/docs" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#aacbbb] px-5 text-sm font-bold text-[#1a4834] hover:bg-[#e9f6ed]"><BookOpen size={17} /> Documentação</Link></div>
        </div>
      </section>
    </div>
  );
}
