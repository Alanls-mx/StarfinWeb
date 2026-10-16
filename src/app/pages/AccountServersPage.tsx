import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { AccountNav } from '../components/AccountNav';
import { assignPluginToServer, claimInstallation, createServer, deleteServer, getInstallationHistory, getMyLicenses, listMyServers, revokeInstallation, transferPluginBetweenServers, unassignPluginFromServer, updateServer, type InstallationEvent, type PurchasedPlugin, type ServerRecord } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountServersPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Array<{ pluginId: number; name: string; source: 'purchase' | 'plan' }>>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [ips, setIps] = useState('');
  const [port, setPort] = useState('');
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, InstallationEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function refresh(authToken: string) {
    const [serverResult, licenseResult] = await Promise.all([listMyServers(authToken), getMyLicenses(authToken)]);
    setServers(serverResult.items);
    setAvailableProducts(serverResult.availableProducts || []);
    setLicenses(licenseResult.items.filter(item => item.status === 'Ativo'));
  }
  useEffect(() => { if (!token) return; let active = true; Promise.all([listMyServers(token), getMyLicenses(token)]).then(([serverResult, licenseResult]) => { if (active) { setServers(serverResult.items); setAvailableProducts(serverResult.availableProducts || []); setLicenses(licenseResult.items.filter(item => item.status === 'Ativo')); } }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar servidores.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [token]);

  function open(server?: ServerRecord) { setEditing(server?.id || 'new'); setName(server?.name || ''); setIps(server?.ips.join(', ') || ''); setPort(server?.authorizedPort ? String(server.authorizedPort) : ''); setError(''); }
  async function save() {
    if (!token || busy) return;
    const values = ips.split(',').map(value => value.trim()).filter(Boolean);
    if (!name.trim() || values.length > 3 || new Set(values).size !== values.length) { setError('Informe um nome e até três IPs distintos.'); return; }
    if (port && (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)) { setError('Informe uma porta entre 1 e 65535.'); return; }
    setBusy(true); setError('');
    try { if (editing && editing !== 'new') await updateServer(token, editing, { name: name.trim(), ips: values, ...(port ? { authorizedPort: Number(port) } : {}) }); else await createServer(token, { name: name.trim(), ips: values }); await refresh(token); setEditing(null); toast.success('Servidor salvo.'); }
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
  async function transferProduct(server: ServerRecord, pluginId: number) {
    const key = `${server.id}:${pluginId}`;
    const targetId = transferTargets[key];
    if (!token || busy || !targetId) return;
    setBusy(true); setError('');
    try { await transferPluginBetweenServers(token, server.id, pluginId, targetId); await refresh(token); toast.success('Produto transferido para outra instalação.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao transferir produto.'); }
    finally { setBusy(false); }
  }
  async function activate(server: ServerRecord) {
    if (!token || busy) return;
    setBusy(true); setError('');
    try { await claimInstallation(token, server.id, codes[server.id] || '', server.revokedISO ? 'Recuperação autorizada pelo proprietário' : 'Ativação pelo proprietário'); setCodes(current => ({ ...current, [server.id]: '' })); await refresh(token); toast.success('StarfinCore vinculado.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao vincular instalação.'); }
    finally { setBusy(false); }
  }
  async function revoke(server: ServerRecord) {
    if (!token || busy) return;
    const reason = revokeReason.trim();
    if (reason.length < 8) { setError('Informe um motivo com pelo menos 8 caracteres.'); return; }
    setBusy(true); setError('');
    try {
      const result = await revokeInstallation(token, server.id, reason);
      if (!result.ok) throw new Error('A instalação não foi desvinculada. Atualize a página e tente novamente.');
      await refresh(token);
      setRevokeTarget(null); setRevokeReason('');
      toast.success('Vínculo revogado e ativações liberadas.');
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao revogar vínculo.'); }
    finally { setBusy(false); }
  }
  async function showHistory(server: ServerRecord) {
    if (!token) return;
    try {
      if (history[server.id]) { setHistory(current => { const next = { ...current }; delete next[server.id]; return next; }); return; }
      const response = await getInstallationHistory(token, server.id);
      setHistory(current => ({ ...current, [server.id]: response.items }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao consultar histórico.'); }
  }

  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32 text-white"><Link to="/login?next=%2Faccount%2Fservers" className="text-[#a9f58e]">Entrar para gerenciar servidores →</Link></main>;
  const uniqueLicenses = availableProducts.length ? availableProducts : [...new Map(licenses.map(item => [item.pluginId, item])).values()];
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-6xl space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Servidores</h1><p className="mt-2 text-sm text-[#bdd2c5]">Gerencie IPs, ativações e produtos. Para vincular o Core, execute /starfincore ativar no Minecraft e confirme o código abaixo.</p></div><button type="button" onClick={() => open()} className="sf-button-primary">Adicionar servidor</button></div><AccountNav />
    {error && <p role="alert" className="border border-red-400/30 p-4 text-sm text-red-200">{error}</p>}
    {editing && <section className="rounded-lg border border-[#85ed65]/40 bg-[#14251e] p-6"><h2 className="text-lg font-semibold">{editing === 'new' ? 'Novo servidor' : 'Editar servidor'}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">Nome<input value={name} maxLength={100} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3" /></label><label className="text-sm">IPs autorizados, separados por vírgula<input value={ips} onChange={event => setIps(event.target.value)} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3 font-mono" /></label>{editing !== 'new' && servers.find(item => item.id === editing)?.linked && <label className="text-sm">Porta autorizada do Minecraft<input type="number" min={1} max={65535} value={port} onChange={event => setPort(event.target.value)} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3 font-mono" /></label>}</div><div className="mt-5 flex gap-3"><button type="button" disabled={busy} onClick={() => void save()} className="sf-button-primary">{busy ? 'Salvando...' : 'Salvar servidor'}</button><button type="button" onClick={() => setEditing(null)} className="rounded-md border border-white/20 px-4 py-2 text-sm">Cancelar</button></div></section>}
    {loading ? <p role="status">Carregando servidores...</p> : servers.length === 0 ? <div className="border-l-2 border-[#85ed65] bg-[#14251e] p-7"><h2 className="text-xl font-semibold">Nenhum servidor cadastrado</h2><p className="mt-2 text-sm text-[#bdd2c5]">Cadastre um servidor para associar suas licenças a uma instalação.</p><button type="button" onClick={() => open()} className="mt-5 text-sm font-bold text-[#a9f58e]">Criar servidor →</button></div> : <div className="grid gap-4 md:grid-cols-2">{servers.map(server => <article key={server.id} className="rounded-lg border border-white/15 bg-[#14251e] p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{server.name}</h2><p className="mt-1 font-mono text-xs text-[#9cb8a6]">{server.linked ? 'Core vinculado' : 'Aguardando Core'} · {server.platform || 'plataforma não informada'}</p></div><div className="flex gap-3 text-sm"><button type="button" onClick={() => open(server)} className="text-[#a9f58e]">Editar</button>{!server.linked && !server.revokedISO && <button type="button" onClick={() => void remove(server)} className="text-red-200">Excluir</button>}</div></div><p className="mt-5 text-xs font-semibold uppercase text-[#9cb8a6]">IPs autorizados</p><p className="mt-2 break-all font-mono text-sm">{server.ips.length ? server.ips.join(' · ') : 'Nenhum IP configurado'}</p><div className="mt-5 border-t border-white/10 pt-5"><h3 className="text-sm font-semibold">Produtos associados ({server.plugins.length})</h3>{uniqueLicenses.length ? <div className="mt-3 flex flex-wrap gap-2">{uniqueLicenses.map(item => <button key={item.pluginId} type="button" disabled={busy} onClick={() => void toggle(server, item.pluginId)} aria-pressed={server.plugins.includes(item.pluginId)} className={`rounded-md border px-3 py-2 text-xs ${server.plugins.includes(item.pluginId) ? 'border-[#85ed65] bg-[#85ed65]/10 text-[#a9f58e]' : 'border-white/20 text-[#bdd2c5]'}`}>{item.name} {server.plugins.includes(item.pluginId) ? '✓' : '+'}</button>)}</div> : <p className="mt-2 text-sm text-[#bdd2c5]">Nenhuma licença ativa para associar.</p>}</div></article>)}</div>}
    {servers.map(server => {
      const active = Boolean(server.linked);
      const mismatch = Boolean(server.observedIp && server.ips.length && !server.ips.includes(server.observedIp));
      return <section key={`core-${server.id}`} className="rounded-lg border border-[#85ed65]/30 bg-[#14251e] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">StarfinCore · {server.name}</h2><span className={active ? 'text-[#a9f58e]' : 'text-amber-200'}>{active ? 'Vinculado' : server.revokedISO ? 'Revogado' : 'Aguardando ativação'}</span></div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-[#9cb8a6]">Identidade</dt><dd className="font-mono">{server.installationIdMasked || 'Ainda não vinculada'}</dd></div>
          <div><dt className="text-[#9cb8a6]">Plataforma / Core</dt><dd>{server.platform || 'Desconhecida'} · {server.coreVersion || '—'}</dd></div>
          <div><dt className="text-[#9cb8a6]">IP observado pela API</dt><dd className="break-all font-mono">{server.observedIp || 'Ainda não observado'}</dd></div>
          <div><dt className="text-[#9cb8a6]">Porta autorizada</dt><dd className="font-mono">{server.authorizedPort || 'Aguardando sincronização'}</dd></div>
          <div><dt className="text-[#9cb8a6]">Última sincronização</dt><dd>{server.lastSyncISO ? new Date(server.lastSyncISO).toLocaleString('pt-BR') : 'Nunca'}</dd></div>
        </dl>
        {mismatch && <p role="status" className="mt-4 border-l-2 border-amber-400 bg-amber-400/10 p-3 text-sm text-amber-100">IP divergente. Use Editar no cadastro acima para incluir o IP observado; não é necessário excluir a instalação.</p>}
        {!active && <div className="mt-5 border-t border-white/10 pt-4"><p className="text-sm">Execute <code>/starfincore ativar</code> no servidor e confirme o código temporário de 10 caracteres aqui.</p><div className="mt-3 flex flex-wrap gap-2"><input aria-label={`Código de ativação de ${server.name}`} value={codes[server.id] || ''} onChange={event => setCodes(current => ({ ...current, [server.id]: event.target.value.toUpperCase() }))} maxLength={10} placeholder="Código de ativação" className="min-w-0 flex-1 rounded-md border border-white/20 bg-[#0b1715] px-3 py-2 font-mono text-sm" /><button type="button" disabled={busy || !/^[0-9A-F]{10}$/.test(codes[server.id] || '')} onClick={() => void activate(server)} className="sf-button-primary">Vincular Core</button></div></div>}
        <div className="mt-5 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold">Ativações por produto</h3><div className="mt-2 flex flex-wrap gap-2">{server.entitlements?.map(item => <span key={item.pluginId} className="rounded border border-white/15 px-3 py-2 text-xs">{uniqueLicenses.find(license => license.pluginId === item.pluginId)?.name || `Produto ${item.pluginId}`}: {item.limit === -1 ? `${item.used} em uso · instalações ilimitadas` : `${item.used}/${item.limit} em uso · ${item.available} disponível`}</span>)}</div></div>
        {server.plugins.length > 0 && servers.length > 1 && <div className="mt-5 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold">Transferir produto</h3><div className="mt-3 space-y-2">{server.plugins.map(pluginId => { const key = `${server.id}:${pluginId}`; return <div key={pluginId} className="flex flex-wrap items-center gap-2 text-sm"><span className="min-w-32">{uniqueLicenses.find(item => item.pluginId === pluginId)?.name || `Produto ${pluginId}`}</span><select aria-label={`Destino para produto ${pluginId} de ${server.name}`} value={transferTargets[key] || ''} onChange={event => setTransferTargets(current => ({ ...current, [key]: event.target.value }))} className="rounded border border-white/20 bg-[#0b1715] px-3 py-2"><option value="">Selecione o destino</option>{servers.filter(item => item.id !== server.id && !item.plugins.includes(pluginId)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={busy || !transferTargets[key]} onClick={() => void transferProduct(server, pluginId)} className="text-[#a9f58e]">Transferir</button></div>; })}</div></div>}
        <div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm"><button type="button" onClick={() => void showHistory(server)} className="text-[#a9f58e]">{history[server.id] ? 'Ocultar histórico' : 'Ver histórico'}</button>{active && <button type="button" disabled={busy} onClick={() => { setRevokeTarget(server.id); setRevokeReason(''); setError(''); }} className="text-red-200">Revogar vínculo</button>}</div>
        {active && revokeTarget === server.id && <div className="mt-4 rounded-md border border-red-300/30 bg-red-950/20 p-4 text-sm"><p>Revogar o Core de <strong>{server.name}</strong> invalida a credencial e libera as ativações de produtos deste servidor.</p><label className="mt-3 block">Motivo (mínimo 8 caracteres)<input value={revokeReason} onChange={event => setRevokeReason(event.target.value)} minLength={8} maxLength={255} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3" /></label><div className="mt-3 flex gap-4"><button type="button" disabled={busy || revokeReason.trim().length < 8} onClick={() => void revoke(server)} className="text-red-200">Confirmar revogação</button><button type="button" disabled={busy} onClick={() => setRevokeTarget(null)} className="text-[#bdd2c5]">Cancelar</button></div></div>}
        {history[server.id] && <ol className="mt-4 space-y-2 text-xs text-[#bdd2c5]">{history[server.id].length ? history[server.id].map(event => <li key={event.id} className="border-l border-white/20 pl-3">{new Date(event.createdISO).toLocaleString('pt-BR')} · {event.action} · {event.reason}</li>) : <li>Nenhum evento registrado.</li>}</ol>}
      </section>;
    })}
  </div></main>;
}
