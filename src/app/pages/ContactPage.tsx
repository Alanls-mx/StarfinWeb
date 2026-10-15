import { ArrowRight, BookOpen, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router';

export function ContactPage() {
  return <main className="mx-auto min-h-[75vh] max-w-5xl px-5 pb-24 pt-32 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Contato</p>
    <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Vamos resolver sua dúvida</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Abra um chamado para questões de compra, licença, instalação ou uso dos plugins. A conversa fica registrada na sua conta para acompanhamento.</p>
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <Link to="/support" className="group rounded-xl border border-primary/30 bg-primary/10 p-7 transition-colors hover:bg-primary/15"><LifeBuoy className="text-primary" size={25}/><h2 className="mt-5 text-xl font-semibold">Abrir chamado</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Descreva o problema e acompanhe as respostas pelo painel de suporte.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Ir para suporte <ArrowRight size={15} className="transition-transform group-hover:translate-x-1"/></span></Link>
      <Link to="/docs" className="group rounded-xl border border-white/10 bg-card p-7 transition-colors hover:border-white/20"><BookOpen className="text-primary" size={25}/><h2 className="mt-5 text-xl font-semibold">Consultar documentação</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Encontre orientações técnicas publicadas para os produtos.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Ver documentação <ArrowRight size={15} className="transition-transform group-hover:translate-x-1"/></span></Link>
    </div>
  </main>;
}
