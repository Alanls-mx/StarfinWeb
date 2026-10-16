import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { downloadMyPluginRelease, getMyPluginReleases, type PluginRelease, type PurchasedPlugin } from '../lib/api';

export function AccountPluginFiles({ token, licenses }: { token: string; licenses: PurchasedPlugin[] }) {
  const [releases, setReleases] = useState<Array<{ plugin: PurchasedPlugin; items: PluginRelease[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const unique = [...new Map(licenses.filter(item => item.status === 'Ativo').map(item => [item.pluginId, item])).values()];
    setLoading(true);
    Promise.all(unique.map(async plugin => ({ plugin, items: (await getMyPluginReleases(token, plugin.pluginId)).items })))
      .then(items => { if (active) { setReleases(items); setError(''); } })
      .catch(() => { if (active) setError('Não foi possível consultar os arquivos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, licenses]);

  return <section className="rounded-xl border border-white/10 bg-card p-6">
    <h2 className="text-xl font-semibold">Arquivos dos plugins</h2>
    <p className="mt-2 text-sm text-muted-foreground">Versões publicadas para suas licenças ativas.</p>
    {loading && <p role="status" className="mt-4 text-sm">Carregando arquivos...</p>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {!loading && !error && releases.every(entry => entry.items.length === 0) && <p className="mt-4 text-sm text-muted-foreground">Ainda não há arquivos publicados para seus plugins.</p>}
    <div className="mt-4 space-y-3">{releases.flatMap(({ plugin, items }) => items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div><strong>{plugin.name} {item.version}</strong><p className="text-xs text-muted-foreground">Minecraft {item.mcVersion} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>{item.notes && <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>}</div><button type="button" onClick={() => downloadMyPluginRelease(token, item).catch(cause => toast.error(cause instanceof Error ? cause.message : 'Falha no download.'))} className="sf-button-primary">Baixar JAR</button></div>))}</div>
  </section>;
}
