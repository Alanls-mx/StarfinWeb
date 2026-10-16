import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';
import { adminCreatePlugin, adminDeletePlugin, adminListCategories, adminListPlugins, adminUpdatePlugin, getPlugin, type PluginDetail, type PluginSummary } from '../../lib/api';
import { AdminPluginReleases } from './AdminPluginReleases';

const field = 'w-full rounded-lg border border-input bg-input-background px-3 py-2.5 text-sm text-white';
const emptyDraft = { name: '', description: '', category: '', licenseName: '', mcVersion: '', imageUrl: '', priceDisplay: '', tags: [] as Array<'Popular' | 'Novo' | 'Premium'> };

export function AdminPluginsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<PluginSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PluginDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    if (!token) return;
    const [products, categoryList] = await Promise.all([adminListPlugins(token), adminListCategories(token)]);
    setItems(products.items);
    setCategories(categoryList.items);
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([adminListPlugins(token), adminListCategories(token)])
      .then(([products, categoryList]) => { if (active) { setItems(products.items); setCategories(categoryList.items); } })
      .catch(() => { if (active) setError('Não foi possível carregar o catálogo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || saving) return;
    setSaving(true); setError('');
    try {
      await adminCreatePlugin(token, draft);
      await refresh();
      setDraft(emptyDraft); setShowForm(false);
      toast.success('Produto cadastrado');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao cadastrar.'); }
    finally { setSaving(false); }
  }

  async function update(id: number, input: Partial<PluginDetail>) {
    if (!token) return false;
    try {
      const next = await adminUpdatePlugin(token, id, input);
      setItems(current => current.map(item => item.id === id ? next : item));
      toast.success('Produto atualizado');
      return true;
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Falha ao salvar.'); return false; }
  }

  async function remove(id: number, name: string) {
    if (!token || !window.confirm(`Excluir ${name} do catálogo?`)) return;
    try { await adminDeletePlugin(token, id); setItems(current => current.filter(item => item.id !== id)); toast.success('Produto excluído'); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Falha ao excluir.'); }
  }

  async function openEditor(id: number) {
    try { setEditing(await getPlugin(id)); setShowForm(false); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Falha ao abrir produto.'); }
  }

  async function saveEditor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const changes = {
        name: editing.name, description: editing.description, category: editing.category,
        licenseName: editing.licenseName, mcVersion: editing.mcVersion,
        priceDisplay: editing.priceDisplay, imageUrl: editing.imageUrl
      };
      if (await update(editing.id, changes)) setEditing(null);
    }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Catálogo</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Plugins</h1><p className="mt-2 text-sm text-muted-foreground">Produtos cadastrados e seus dados comerciais.</p></div>
      <button type="button" onClick={() => setShowForm(value => !value)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={17}/> Novo produto</button>
    </header>
    {error && <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
    {showForm && <form onSubmit={create} className="grid gap-4 rounded-xl border border-white/10 bg-card p-6 md:grid-cols-2">
      <h2 className="md:col-span-2 text-lg font-semibold">Cadastrar produto</h2>
      <label className="space-y-2 text-sm">Nome<input required className={field} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
      <label className="space-y-2 text-sm">ID canônico da licença<input className={field} value={draft.licenseName} onChange={event => setDraft({ ...draft, licenseName: event.target.value })} placeholder="Ex.: starfin_bans"/></label>
      <label className="space-y-2 text-sm md:col-span-2">Descrição<textarea required className={field} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })}/></label>
      <label className="space-y-2 text-sm">Categoria<select required className={field} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}><option value="">Selecione</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
      <label className="space-y-2 text-sm">Minecraft<input required className={field} value={draft.mcVersion} onChange={event => setDraft({ ...draft, mcVersion: event.target.value })}/></label>
      <label className="space-y-2 text-sm">Preço exibido<input required className={field} value={draft.priceDisplay} onChange={event => setDraft({ ...draft, priceDisplay: event.target.value })} placeholder="R$ 29,90"/></label>
      <label className="space-y-2 text-sm">URL da imagem do produto<input required type="url" className={field} value={draft.imageUrl} onChange={event => setDraft({ ...draft, imageUrl: event.target.value })}/></label>
      <div className="flex gap-3 md:col-span-2"><button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Salvando...' : 'Cadastrar'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm">Cancelar</button></div>
    </form>}
    {editing && <form onSubmit={saveEditor} className="grid gap-4 rounded-xl border border-white/10 bg-card p-6 md:grid-cols-2">
      <h2 className="md:col-span-2 text-lg font-semibold">Editar {editing.name}</h2>
      <label className="space-y-2 text-sm">Nome<input required className={field} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })}/></label>
      <label className="space-y-2 text-sm">ID canônico da licença<input className={field} value={editing.licenseName || ''} onChange={event => setEditing({ ...editing, licenseName: event.target.value })}/></label>
      <label className="space-y-2 text-sm md:col-span-2">Descrição<textarea required className={field} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })}/></label>
      <label className="space-y-2 text-sm">Categoria<select required className={field} value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })}>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
      <label className="space-y-2 text-sm">Minecraft<input required className={field} value={editing.mcVersion} onChange={event => setEditing({ ...editing, mcVersion: event.target.value })}/></label>
      <label className="space-y-2 text-sm">Preço exibido<input required className={field} value={editing.priceDisplay} onChange={event => setEditing({ ...editing, priceDisplay: event.target.value })}/></label>
      <label className="space-y-2 text-sm md:col-span-2">URL da imagem<input required type="url" className={field} value={editing.imageUrl} onChange={event => setEditing({ ...editing, imageUrl: event.target.value })}/></label>
      <div className="flex gap-3 md:col-span-2"><button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar alterações'}</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm">Cancelar</button></div>
    </form>}
    {editing && token && <AdminPluginReleases token={token} pluginId={editing.id} />}
    {loading ? <p role="status" className="text-sm text-muted-foreground">Carregando produtos...</p> : items.length === 0 ? <p className="rounded-xl border border-dashed border-white/15 p-12 text-center text-muted-foreground">Nenhum produto cadastrado.</p> :
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Produto</th><th className="p-4">Licença</th><th className="p-4">Categoria</th><th className="p-4">Preço</th><th className="p-4">Destaque</th><th className="p-4">Ações</th></tr></thead><tbody className="divide-y divide-white/10">{items.map(product => <tr key={product.id}>
        <td className="p-4"><span className="font-medium text-white">{product.name}</span><span className="block text-xs text-muted-foreground">#{product.id} · {product.mcVersion}</span></td><td className="p-4 font-mono text-xs">{product.licenseName || '—'}</td><td className="p-4">{product.category}</td><td className="p-4">{product.priceDisplay}</td>
        <td className="p-4"><button type="button" aria-pressed={product.featured} onClick={() => update(product.id, { featured: !product.featured })} className="rounded-md border border-white/15 px-3 py-1.5 text-xs">{product.featured ? 'Sim' : 'Não'}</button></td>
        <td className="p-4"><div className="flex gap-3"><button type="button" onClick={() => openEditor(product.id)} className="text-primary hover:underline">Editar</button><Link to={`/plugins/${product.id}`} className="text-primary hover:underline">Ver</Link><button type="button" aria-label={`Excluir ${product.name}`} onClick={() => remove(product.id, product.name)} className="text-destructive"><Trash2 size={15}/></button></div></td>
      </tr>)}</tbody></table></div>}
  </main>;
}
