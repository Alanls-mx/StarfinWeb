import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AccountNav } from '../components/AccountNav';
import { getMyNotifications, readAllNotifications, type UserNotification } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountNotificationsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!token) return; let active = true; getMyNotifications(token).then(result => { if (active) setItems(result); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar notificações.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [token]);
  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32 text-white"><Link to="/login?next=%2Faccount%2Fnotifications" className="text-[#a9f58e]">Entrar para ver notificações →</Link></main>;
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-6xl space-y-8"><div><h1 className="text-3xl font-bold">Notificações</h1><p className="mt-2 text-[#bdd2c5]">Avisos enviados para sua conta.</p></div><AccountNav />{error && <p role="alert" className="text-red-200">{error}</p>}{loading ? <p role="status">Carregando notificações...</p> : <><div className="flex justify-end">{items.some(item => !item.readISO) && <button type="button" disabled={saving} onClick={async () => { setSaving(true); try { await readAllNotifications(token); setItems(await getMyNotifications(token)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao marcar notificações.'); } finally { setSaving(false); } }} className="text-sm font-semibold text-[#a9f58e] disabled:opacity-50">Marcar todas como lidas</button>}</div>{items.length ? <ol className="divide-y divide-white/10 border-y border-white/15">{items.map(item => <li key={item.id} className="py-5"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${item.readISO ? 'bg-white/30' : 'bg-[#85ed65]'}`} /><strong>{item.title}</strong></div><p className="mt-2 pl-4 text-sm text-[#bdd2c5]">{item.message}</p><time className="mt-2 block pl-4 text-xs text-[#8baa99]" dateTime={item.createdISO}>{new Date(item.createdISO).toLocaleString('pt-BR')}</time></li>)}</ol> : <p className="border-l-2 border-[#85ed65] bg-[#14251e] p-6 text-[#bdd2c5]">Nenhuma notificação pessoal disponível.</p>}</>}</div></main>;
}
