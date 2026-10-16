import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AccountNav } from '../components/AccountNav';
import { assignPluginToServer, createServer, deleteServer, getMyLicenses, listMyServers, unassignPluginFromServer, updateServer, type PurchasedPlugin, type ServerRecord } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountServersPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [ips, setIps] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function refresh(authToken: string) {
    const [serverResult, licenseResult] = await Promise.all([listMyServers(authToken), getMyLicenses(authToken)]);
    setServers(serverResult.items);
    setLicenses(licenseResult.items.filter(item => item.status === 'Ativo'));
  }
  useEffect(() => { if (!token) return; let active = true; Promise.all([listMyServers(token), getMyLicenses(token)]).then(([serverResult, licenseResult]) => { if (active) { setServers(serverResult.items); setLicenses(licenseResult.items.filter(item => item.status === 'Ativo')); } }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar servidores.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [token]);

  function open(server?: ServerRecord) { setEditing(server?.id || 'new'); setName(server?.name || ''); setIps(server?.ips.join(', ') || ''); setError(''); }
  async function save() {
    if (!token || busy) return;
    const values = ips.split(',').map(value => value.trim()).filter(Boolean);
    if (!name.trim() || values.length > 3 || new Set(values).size !== values.length) { setError('Informe um nome e até três IPs distintos.'); return; }
    setBusy(true); setError('');
    try { if (editing && editing !== 'new') await updateServer(token, editing, { name: name.trim(), ips: values }); else await createServer(token, { name: name.trim(), ips: values }); await refresh(token); setEditing(null); toast.success('Servidor salvo.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao salvar servidor.'); }
    finally { setBusy(false); }
  }
  async function remove(server: ServerRecord) {
    if (!token || busy || !window.confirm(`Excluir o servidor ${server.name}? As instalações ligadas a ele serão removidas.`)) return;
    setBusy(true); setError('');
    try { await deleteServer(token, server.id); await refresh(token); toast.success('Servidor excluído.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao excluir servidor.'); }
    finally { setBusy(false); }
  }
  async function toggle(server: ServerRecord, pluginId: number) {
    if (!token || busy) return;
    setBusy(true); setError('');
    try { if (server.plugins.includes(pluginId)) await unassignPluginFromServer(token, server.id, pluginId); else await assignPluginToServer(token, server.id, pluginId); await refresh(token); toast.success('Instalação atualizada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao atualizar instalação.'); }
    finally { setBusy(false); }
  }

  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32 text-white"><Link to="/login?next=%2Faccount%2Fservers" className="text-[#a9f58e]">Entrar para gerenciar servidores →</Link></main>;
  const uniqueLicenses = [...new Map(licenses.map(item => [item.pluginId, item])).values()];
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-6xl space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Servidores</h1><p className="mt-2 text-sm text-[#bdd2c5]">Organize IPs e produtos autorizados em cada instalação.</p></div><button type="button" onClick={() => open()} className="sf-button-primary">Adicionar servidor</button></div><AccountNav />
    {error && <p role="alert" className="border border-red-400/30 p-4 text-sm text-red-200">{error}</p>}
    {editing && <section className="rounded-lg border border-[#85ed65]/40 bg-[#14251e] p-6"><h2 className="text-lg font-semibold">{editing === 'new' ? 'Novo servidor' : 'Editar servidor'}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">Nome<input value={name} maxLength={100} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3" /></label><label className="text-sm">IPs autorizados, separados por vírgula<input value={ips} onChange={event => setIps(event.target.value)} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3 font-mono" /></label></div><div className="mt-5 flex gap-3"><button type="button" disabled={busy} onClick={() => void save()} className="sf-button-primary">{busy ? 'Salvando...' : 'Salvar servidor'}</button><button type="button" onClick={() => setEditing(null)} className="rounded-md border border-white/20 px-4 py-2 text-sm">Cancelar</button></div></section>}
    {loading ? <p role="status">Carregando servidores...</p> : servers.length === 0 ? <div className="border-l-2 border-[#85ed65] bg-[#14251e] p-7"><h2 className="text-xl font-semibold">Nenhum servidor cadastrado</h2><p className="mt-2 text-sm text-[#bdd2c5]">Cadastre um servidor para associar suas licenças a uma instalação.</p><button type="button" onClick={() => open()} className="mt-5 text-sm font-bold text-[#a9f58e]">Criar servidor →</button></div> : <div className="grid gap-4 md:grid-cols-2">{servers.map(server => <article key={server.id} className="rounded-lg border border-white/15 bg-[#14251e] p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{server.name}</h2><p className="mt-1 font-mono text-xs text-[#9cb8a6]">Cadastrado · plataforma não informada</p></div><div className="flex gap-3 text-sm"><button type="button" onClick={() => open(server)} className="text-[#a9f58e]">Editar</button><button type="button" onClick={() => void remove(server)} className="text-red-200">Excluir</button></div></div><p className="mt-5 text-xs font-semibold uppercase text-[#9cb8a6]">IPs autorizados</p><p className="mt-2 break-all font-mono text-sm">{server.ips.length ? server.ips.join(' · ') : 'Nenhum IP configurado'}</p><div className="mt-5 border-t border-white/10 pt-5"><h3 className="text-sm font-semibold">Produtos associados ({server.plugins.length})</h3>{uniqueLicenses.length ? <div className="mt-3 flex flex-wrap gap-2">{uniqueLicenses.map(item => <button key={item.pluginId} type="button" disabled={busy} onClick={() => void toggle(server, item.pluginId)} aria-pressed={server.plugins.includes(item.pluginId)} className={`rounded-md border px-3 py-2 text-xs ${server.plugins.includes(item.pluginId) ? 'border-[#85ed65] bg-[#85ed65]/10 text-[#a9f58e]' : 'border-white/20 text-[#bdd2c5]'}`}>{item.name} {server.plugins.includes(item.pluginId) ? '✓' : '+'}</button>)}</div> : <p className="mt-2 text-sm text-[#bdd2c5]">Nenhuma licença ativa para associar.</p>}</div></article>)}</div>}
  </div></main>;
}
