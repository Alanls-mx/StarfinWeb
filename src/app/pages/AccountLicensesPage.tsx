import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Copy, KeyRound, RefreshCw } from 'lucide-react';
import { getMyLicenses, getMySettings, regenerateMyLicense, updateMyAllowedIp, type PurchasedPlugin } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountLicensesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [key, setKey] = useState('');
  const [visible, setVisible] = useState(false);
  const [ip, setIp] = useState('');
  const [savedIp, setSavedIp] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([getMySettings(token), getMyLicenses(token)]).then(([settings, result]) => {
      if (cancelled) return;
      setKey(settings.licenseKey || '');
      setIp(settings.allowedIp || '');
      setSavedIp(settings.allowedIp || '');
      setLicenses(result.items);
      setError('');
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as licenças.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function saveIp() {
    if (!token) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await updateMyAllowedIp(token, ip.trim() || null);
      setSavedIp(ip.trim());
      setMessage('IP autorizado atualizado.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o IP.'); }
    finally { setBusy(false); }
  }

  async function regenerate() {
    if (!token || !window.confirm('Regenerar a chave principal? A chave principal anterior deixará de funcionar imediatamente.')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await regenerateMyLicense(token);
      setKey(result.licenseKey);
      setVisible(false);
      setMessage('Chave principal regenerada. Atualize a configuração do StarfinCore que usa a chave anterior.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível regenerar a chave.'); }
    finally { setBusy(false); }
  }

  if (!token) return <main className="mx-auto min-h-[65vh] max-w-5xl px-5 pt-32"><h1 className="text-3xl font-semibold">Minhas licenças</h1><p className="mt-4 text-muted-foreground">Entre para consultar suas licenças.</p><Link to="/login?next=/account/licenses" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrar</Link></main>;

  return <main className="mx-auto min-h-[75vh] max-w-5xl px-5 pb-24 pt-32 sm:px-8">
    <Link to="/account" className="text-sm text-primary hover:underline">← Minha conta</Link>
    <div className="mt-5 border-b border-white/15 bg-[#10221b] p-7 text-white sm:p-9"><h1 className="text-4xl font-extrabold tracking-[-.025em]">Minhas licenças</h1><p className="mt-3 max-w-xl text-sm leading-7 text-[#bdd2c5]">A chave principal identifica sua conta no StarfinCore. O acesso depende das compras e das regras da API.</p></div>
    {error && <p role="alert" className="mt-8 rounded-xl border border-destructive/40 p-4 text-destructive">{error}</p>}
    {message && <p role="status" className="mt-8 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">{message}</p>}
    {loading ? <p role="status" className="mt-10 text-muted-foreground">Carregando licenças...</p> : <>
      <section className="mt-9 rounded-xl border border-white/10 bg-card p-6 sm:p-8" aria-labelledby="global-key-title">
        <div className="flex items-center gap-3"><KeyRound className="text-primary" /><h2 id="global-key-title" className="text-xl font-semibold">Chave principal</h2></div>
        <p className="mt-3 text-sm text-muted-foreground">Guarde esta chave em local privado. Copie para o campo <code>license.key</code> do StarfinCore.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3"><code className="min-w-0 break-all rounded-lg border border-white/10 bg-background px-4 py-3 font-mono text-sm">{key ? visible ? key : `•••• •••• ${key.slice(-4)}` : 'Indisponível'}</code><button type="button" disabled={!key} onClick={() => setVisible(value => !value)} className="rounded-lg border border-white/20 px-4 py-3 text-sm disabled:opacity-50">{visible ? 'Ocultar' : 'Mostrar'}</button><button type="button" disabled={!key} onClick={() => void navigator.clipboard.writeText(key).then(() => setMessage('Chave copiada.')).catch(() => setError('Não foi possível copiar a chave.'))} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm disabled:opacity-50"><Copy size={15} /> Copiar</button></div>
        <button type="button" disabled={!key || busy} onClick={() => void regenerate()} className="mt-7 inline-flex items-center gap-2 rounded-lg border border-amber-400/30 px-4 py-3 text-sm text-amber-200 disabled:opacity-50"><RefreshCw size={15} /> Regenerar chave principal</button>
      </section>
      <section className="mt-6 rounded-xl border border-white/10 bg-card p-6 sm:p-8" aria-labelledby="ip-title"><h2 id="ip-title" className="text-xl font-semibold">IP global autorizado</h2><p className="mt-2 text-sm text-muted-foreground">Opcional. Quando definido, a API exige esse IP ou um servidor cadastrado com o IP observado. Alterar o IP não cria uma nova compra.</p><div className="mt-5 flex flex-wrap gap-3"><input aria-label="IP global autorizado" value={ip} onChange={event => setIp(event.target.value)} placeholder="IPv4 ou IPv6" className="min-w-0 flex-1 rounded-lg border border-white/20 bg-background px-4 py-3 font-mono text-sm" /><button type="button" disabled={busy || ip.trim() === savedIp} onClick={() => void saveIp()} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">Salvar IP</button></div></section>
      <section className="mt-9" aria-labelledby="products-title"><h2 id="products-title" className="text-2xl font-semibold">Licenças de produtos</h2>{licenses.length === 0 ? <div className="mt-5 border-l-2 border-[#85ed65] bg-[#14251e] p-7"><h3 className="text-lg font-bold">Nenhuma licença de produto</h3><p className="mt-2 text-sm leading-7 text-[#bdd2c5]">Quando uma compra for aprovada, a licença aparecerá aqui.</p><Link to="/plugins" className="mt-5 inline-flex font-bold text-[#a9f58e] hover:underline">Ver produtos publicados →</Link></div> : <ul className="mt-5 divide-y divide-white/10 border-y border-white/15">{licenses.map(license => <li key={`${license.id}-${license.pluginId}`} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h3 className="font-semibold">{license.name}</h3><p className="mt-1 font-mono text-xs text-[#a9c1b8]">Versão {license.version} · {license.status}</p><p className="mt-1 text-xs text-muted-foreground">Adquirido em {new Date(license.purchaseDateISO).toLocaleDateString('pt-BR')}</p></div><Link to={`/plugins/${license.pluginId}`} className="text-sm text-primary hover:underline">Ver produto</Link></li>)}</ul>}</section>
    </>}
  </main>;
}
