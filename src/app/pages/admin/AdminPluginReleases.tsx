import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminDeletePluginRelease, adminListPluginReleases, adminPublishPluginRelease, adminUploadPluginRelease, type PluginRelease } from '../../lib/api';

export function AdminPluginReleases({ token, pluginId }: { token: string; pluginId: number }) {
  const [items, setItems] = useState<PluginRelease[]>([]);
  const [version, setVersion] = useState('');
  const [mcVersion, setMcVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setItems((await adminListPluginReleases(token, pluginId)).items);
  }

  useEffect(() => { refresh().catch(() => toast.error('Falha ao carregar versões.')); }, [token, pluginId]);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    try {
      await adminUploadPluginRelease(token, pluginId, { version, mcVersion, notes, file });
      setVersion(''); setMcVersion(''); setNotes(''); setFile(null);
      await refresh();
      toast.success('Versão salva como rascunho. Publique após conferir o arquivo.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao enviar versão.'); }
    finally { setBusy(false); }
  }

  async function publish(item: PluginRelease) {
    try {
      await adminPublishPluginRelease(token, item.id, !item.published);
      await refresh();
      toast.success(item.published ? 'Versão retirada do ar.' : 'Versão publicada.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao alterar publicação.'); }
  }

  async function remove(item: PluginRelease) {
    if (!window.confirm(`Excluir o rascunho ${item.version}?`)) return;
    try { await adminDeletePluginRelease(token, item.id); await refresh(); toast.success('Rascunho excluído.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao excluir.'); }
  }

  return <section className="space-y-4 rounded-xl border border-white/10 bg-card p-6">
    <div><h3 className="text-lg font-semibold">Versões e arquivos privados</h3><p className="mt-1 text-sm text-muted-foreground">O JAR fica fora da pasta pública. Apenas clientes com licença ativa podem baixar versões publicadas.</p></div>
    <form onSubmit={upload} className="grid gap-3 md:grid-cols-2">
      <label className="text-sm">Versão<input required maxLength={64} value={version} onChange={event => setVersion(event.target.value)} className="mt-1 w-full rounded-lg border border-input bg-input-background p-2" placeholder="1.0.0" /></label>
      <label className="text-sm">Minecraft<input required maxLength={64} value={mcVersion} onChange={event => setMcVersion(event.target.value)} className="mt-1 w-full rounded-lg border border-input bg-input-background p-2" placeholder="1.21.1" /></label>
      <label className="text-sm md:col-span-2">Notas<textarea maxLength={4000} value={notes} onChange={event => setNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-input bg-input-background p-2" /></label>
      <label className="text-sm md:col-span-2">Arquivo JAR (até 50 MB)<input required type="file" accept=".jar" onChange={event => setFile(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm" /></label>
      <button disabled={busy || !file} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Enviando...' : 'Enviar rascunho'}</button>
    </form>
    <ul className="space-y-2">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><div><strong>{item.version}</strong> · Minecraft {item.mcVersion} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB<p className="text-xs text-muted-foreground">{item.originalName} · SHA-256 {item.sha256.slice(0, 16)}…</p></div><div className="flex gap-3"><button type="button" onClick={() => publish(item)} className="text-primary">{item.published ? 'Retirar' : 'Publicar'}</button>{!item.published && <button type="button" onClick={() => remove(item)} className="text-destructive">Excluir</button>}</div></li>)}</ul>
    {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma versão enviada.</p>}
  </section>;
}
