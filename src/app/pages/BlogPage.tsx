import { useEffect, useState } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router';
import { getChangelog, type ChangelogEntry } from '../lib/api';

export function BlogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getChangelog().then(result => { if (!cancelled) setEntries(result.items); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as novidades.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return <main className="mx-auto min-h-[75vh] max-w-5xl px-5 pb-24 pt-32 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Atualizações</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Novidades da plataforma</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Publicações registradas no changelog da StarfinPlugins.</p>
    {loading ? <p role="status" className="mt-10 text-muted-foreground">Carregando publicações...</p> : error ? <p role="alert" className="mt-10 rounded-xl border border-destructive/40 p-5 text-destructive">{error}</p> : entries.length === 0 ? <div className="mt-10 rounded-xl border border-white/10 bg-card p-10 text-center"><Newspaper className="mx-auto text-primary"/><h2 className="mt-4 text-xl font-semibold">Ainda não há publicações</h2><p className="mt-2 text-sm text-muted-foreground">As novidades aparecerão aqui quando forem publicadas.</p></div> : <ul className="mt-10 space-y-4">{entries.map(entry => <li key={entry.id} className="rounded-xl border border-white/10 bg-card p-6 sm:p-7"><div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-primary">{entry.version}</span><time dateTime={entry.createdISO}>{new Date(entry.createdISO).toLocaleDateString('pt-BR')}</time></div><h2 className="mt-4 text-xl font-semibold">{entry.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{entry.body}</p></li>)}</ul>}
    <Link to="/changelog" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Ver histórico completo <ArrowRight size={16}/></Link>
  </main>;
}
