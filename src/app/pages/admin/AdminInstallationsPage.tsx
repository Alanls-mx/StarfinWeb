import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  adminInstallationHistory, adminListUserInstallations, adminRevokeInstallation,
  adminRevokeProductAssignment, adminTransferInstallation, adminTransferProductAssignment,
  getAdminUsers, type InstallationEvent, type ServerRecord, type UserProfile
} from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminInstallationsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userId, setUserId] = useState('');
  const [items, setItems] = useState<ServerRecord[]>([]);
  const [history, setHistory] = useState<Record<string, InstallationEvent[]>>({});
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (token) getAdminUsers(token).then(result => setUsers(result.items)).catch(cause => setError(String(cause))); }, [token]);
  async function refresh(nextId = userId) {
    if (!token || !nextId) { setItems([]); return; }
    try { const result = await adminListUserInstallations(token, nextId); setItems(result.items); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao consultar instalações.'); }
  }
  async function revoke(server: ServerRecord) {
    if (!token || busy) return;
    const reason = window.prompt(`Motivo da revogação de ${server.name} (mínimo 10 caracteres):`);
    if (!reason) return;
    setBusy(true);
    try { await adminRevokeInstallation(token, server.id, reason); await refresh(); toast.success('Instalação revogada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha na revogação.'); }
    finally { setBusy(false); }
  }
  async function transfer(server: ServerRecord) {
    if (!token || busy) return;
    const targetUserId = window.prompt('ID da conta de destino:');
    if (!targetUserId) return;
    const reason = window.prompt('Motivo da transferência (mínimo 10 caracteres):');
    if (!reason) return;
    setBusy(true);
    try { await adminTransferInstallation(token, server.id, targetUserId, reason); await refresh(); toast.success('Instalação transferida; credencial e atribuições revogadas.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha na transferência.'); }
    finally { setBusy(false); }
  }
  async function inspect(server: ServerRecord) {
    if (!token) return;
    if (history[server.id]) { setHistory(current => { const next = { ...current }; delete next[server.id]; return next; }); return; }
    try { const response = await adminInstallationHistory(token, server.id); setHistory(current => ({ ...current, [server.id]: response.items })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar histórico.'); }
  }
  async function changeProduct(server: ServerRecord, pluginId: number, targetId?: string) {
    if (!token || busy) return;
    const reason = window.prompt(`${targetId ? 'Transferir' : 'Revogar'} produto #${pluginId}: informe o motivo (mínimo 10 caracteres):`);
    if (!reason) return;
    setBusy(true); setError('');
    try {
      if (targetId) await adminTransferProductAssignment(token, server.id, pluginId, targetId, reason);
      else await adminRevokeProductAssignment(token, server.id, pluginId, reason);
      await refresh(); toast.success(targetId ? 'Produto transferido.' : 'Atribuição revogada.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao alterar atribuição.'); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-6xl space-y-6 text-white"><div><h1 className="text-3xl font-bold">Licenças e instalações</h1><p className="mt-2 text-sm text-[#bdd2c5]">Consulte consumo, identidade, rede e histórico. Transferências revogam a credencial e removem atribuições do proprietário anterior.</p></div>
    <label className="block max-w-xl text-sm">Cliente<select value={userId} onChange={event => { setUserId(event.target.value); void refresh(event.target.value); }} className="mt-2 w-full rounded-md border border-white/20 bg-[#10231d] p-3"><option value="">Selecione um cliente</option>{users.map(user => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
    {error && <p role="alert" className="border border-red-400/30 p-4 text-red-200">{error}</p>}
    {userId && items.length === 0 && <p className="text-sm text-[#bdd2c5]">Nenhuma instalação cadastrada para este cliente.</p>}
    <div className="grid gap-4 lg:grid-cols-2">{items.map(server => <article key={server.id} className="rounded-lg border border-white/15 bg-[#14251e] p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{server.name}</h2><p className="mt-1 font-mono text-xs text-[#9cb8a6]">{server.installationIdMasked || 'Não vinculada'} · {server.linked ? 'Ativa' : server.revokedISO ? 'Revogada' : 'Pendente'}</p></div><span className="text-xs text-[#bdd2c5]">{server.platform || '—'} · {server.coreVersion || '—'}</span></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-[#9cb8a6]">IP autorizado</dt><dd>{server.ips.length ? server.ips.join(', ') : 'Sem restrição'}</dd></div><div><dt className="text-[#9cb8a6]">IP observado</dt><dd>{server.observedIp || 'Nunca'}</dd></div><div><dt className="text-[#9cb8a6]">Última validação</dt><dd>{server.lastSyncISO ? new Date(server.lastSyncISO).toLocaleString('pt-BR') : 'Nunca'}</dd></div><div><dt className="text-[#9cb8a6]">Produtos atribuídos</dt><dd>{server.plugins.length}</dd></div></dl>
      <div className="mt-4 space-y-1 text-xs text-[#bdd2c5]">{server.entitlements?.map(entry => <p key={entry.pluginId}>Produto #{entry.pluginId}: {entry.used}/{entry.purchased} ativações usadas; {entry.available} disponíveis</p>)}</div>
      {server.plugins.length > 0 && <div className="mt-4 space-y-3 border-t border-white/10 pt-4"><h3 className="text-sm font-semibold">Atribuições desta instalação</h3>{server.plugins.map(pluginId => { const key = `${server.id}:${pluginId}`; return <div key={pluginId} className="flex flex-wrap items-center gap-2 text-xs"><span>Produto #{pluginId}</span><select aria-label={`Destino do produto ${pluginId}`} value={transferTargets[key] || ''} onChange={event => setTransferTargets(current => ({ ...current, [key]: event.target.value }))} className="rounded border border-white/20 bg-[#10231d] px-2 py-1"><option value="">Selecione o destino</option>{items.filter(item => item.id !== server.id && !item.plugins.includes(pluginId)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" disabled={busy || !transferTargets[key]} onClick={() => void changeProduct(server, pluginId, transferTargets[key])} className="text-amber-200">Transferir</button><button type="button" disabled={busy} onClick={() => void changeProduct(server, pluginId)} className="text-red-200">Revogar</button></div>; })}</div>}
      <div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm"><button type="button" onClick={() => void inspect(server)} className="text-[#a9f58e]">{history[server.id] ? 'Ocultar histórico' : 'Ver histórico'}</button>{server.linked && <button type="button" disabled={busy} onClick={() => void revoke(server)} className="text-red-200">Revogar</button>}<button type="button" disabled={busy} onClick={() => void transfer(server)} className="text-amber-200">Transferir</button></div>
      {history[server.id] && <ol className="mt-4 space-y-2 text-xs text-[#bdd2c5]">{history[server.id].map(event => <li key={event.id}>{new Date(event.createdISO).toLocaleString('pt-BR')} · {event.action} · {event.reason}</li>)}</ol>}
    </article>)}</div>
  </div>;
}
