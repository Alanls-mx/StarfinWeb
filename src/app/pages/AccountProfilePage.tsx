import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { getMySettings, removeMyAvatar, updateMyPassword, updateMyProfile, uploadMyAvatar } from '../lib/api';
import { useAuth } from '../lib/auth';

type Profile = { name: string; email: string; avatarUrl: string | null; bio: string; discordId: string; githubUrl: string; twitterUrl: string };

export function AccountProfilePage() {
  const { state, refresh } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMySettings(token).then(result => {
      if (active) setProfile({ name: result.name, email: result.email, avatarUrl: result.avatarUrl, bio: result.bio || '', discordId: result.discordId || '', githubUrl: result.githubUrl || '', twitterUrl: result.twitterUrl || '' });
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o perfil.'); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!file || !canvasRef.current) return;
    let active = true;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!active || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      const size = canvas.width;
      const scale = Math.max(size / image.width, size / image.height) * zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) * position.x / 100;
      const y = (size - height) * position.y / 100;
      context.clearRect(0, 0, size, size);
      context.drawImage(image, x, y, width, height);
    };
    image.src = url;
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file, zoom, position]);

  function selectFile(next: File | undefined) {
    if (!next) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(next.type) || next.size > 5 * 1024 * 1024) {
      setError('Use PNG, JPG ou WEBP com até 5 MB.');
      return;
    }
    setError(''); setFile(next); setZoom(1); setPosition({ x: 50, y: 50 });
  }

  async function saveProfile() {
    if (!token || !profile || saving) return;
    setSaving(true); setError('');
    try {
      if (file) {
        const blob = await new Promise<Blob>((resolve, reject) => canvasRef.current?.toBlob(value => value ? resolve(value) : reject(new Error('Falha ao recortar imagem')), 'image/jpeg', .9));
        const result = await uploadMyAvatar(token, new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
        setProfile(current => current ? { ...current, avatarUrl: result.avatarUrl } : current);
        setFile(null);
      }
      await updateMyProfile(token, { bio: profile.bio, discordId: profile.discordId, githubUrl: profile.githubUrl, twitterUrl: profile.twitterUrl });
      await refresh();
      toast.success('Perfil salvo.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao salvar perfil.'); }
    finally { setSaving(false); }
  }

  async function removeAvatar() {
    if (!token || saving) return;
    setSaving(true);
    try { await removeMyAvatar(token); setProfile(current => current ? { ...current, avatarUrl: null } : current); setFile(null); await refresh(); toast.success('Avatar removido.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao remover avatar.'); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (!token || saving) return;
    if (password.newPassword.length < 8 || password.newPassword !== password.confirmation) { setError('A nova senha precisa ter pelo menos 8 caracteres e coincidir com a confirmação.'); return; }
    setSaving(true); setError('');
    try { await updateMyPassword(token, { currentPassword: password.currentPassword, newPassword: password.newPassword }); setPassword({ currentPassword: '', newPassword: '', confirmation: '' }); toast.success('Senha alterada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao alterar senha.'); }
    finally { setSaving(false); }
  }

  if (state.status === 'loading') return <main className="min-h-screen px-5 pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32 text-center text-white"><p>Entre para editar seu perfil.</p><Link to="/login?next=%2Faccount%2Fprofile" className="text-[#a9f58e] underline">Entrar</Link></main>;

  const field = 'mt-2 w-full rounded-lg border border-white/20 bg-[#0b1715] px-4 py-3 text-white';
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-4xl space-y-8">
    <div><Link to="/account" className="text-sm text-[#a9f58e]">← Minha conta</Link><h1 className="mt-4 text-3xl font-bold">Perfil e segurança</h1><p className="mt-2 text-sm text-[#bdd2c5]">Gerencie sua foto, apresentação e senha.</p></div>
    {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
    {!profile ? <p role="status">Carregando perfil...</p> : <>
      <section className="rounded-lg border border-white/15 bg-[#14251e] p-6 sm:p-8"><h2 className="text-xl font-semibold">Foto e informações</h2>
        <div className="mt-6 flex flex-wrap items-start gap-6"><div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#85ed65]/40 bg-[#0b1715]">{file ? <canvas ref={canvasRef} width={320} height={320} className="h-full w-full" /> : profile.avatarUrl ? <img src={profile.avatarUrl} alt="Seu avatar" className="h-full w-full object-cover" /> : <span className="text-3xl font-bold text-[#85ed65]">{profile.name[0]?.toUpperCase() || 'S'}</span>}</div>
          <div className="space-y-3"><label className="inline-block cursor-pointer rounded-lg bg-[#85ed65] px-4 py-2.5 text-sm font-bold text-[#112516]">Selecionar imagem<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => { selectFile(event.target.files?.[0]); event.target.value = ''; }} /></label><p className="text-xs text-[#bdd2c5]">PNG, JPG ou WEBP, até 5 MB. A imagem será recortada em quadrado.</p>{(profile.avatarUrl || file) && <button type="button" disabled={saving} onClick={() => file ? setFile(null) : void removeAvatar()} className="block text-sm text-red-200 underline">Remover foto</button>}</div></div>
        {file && <div className="mt-6 grid gap-4 sm:grid-cols-3"><label className="text-sm">Aproximar<input type="range" min="1" max="3" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="mt-2 w-full" /></label><label className="text-sm">Horizontal<input type="range" min="0" max="100" value={position.x} onChange={event => setPosition(current => ({ ...current, x: Number(event.target.value) }))} className="mt-2 w-full" /></label><label className="text-sm">Vertical<input type="range" min="0" max="100" value={position.y} onChange={event => setPosition(current => ({ ...current, y: Number(event.target.value) }))} className="mt-2 w-full" /></label></div>}
        <div className="mt-7 grid gap-4 sm:grid-cols-2"><div><span className="text-sm text-[#bdd2c5]">Nome</span><p className="mt-2 font-medium">{profile.name}</p></div><div><span className="text-sm text-[#bdd2c5]">E-mail</span><p className="mt-2 font-medium">{profile.email}</p></div></div>
        <label className="mt-6 block text-sm">Biografia<textarea value={profile.bio} maxLength={500} onChange={event => setProfile({ ...profile, bio: event.target.value })} className={`${field} min-h-24`} /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">Discord<input value={profile.discordId} onChange={event => setProfile({ ...profile, discordId: event.target.value })} className={field}/></label><label className="text-sm">GitHub<input value={profile.githubUrl} onChange={event => setProfile({ ...profile, githubUrl: event.target.value })} className={field}/></label></div>
        <button type="button" disabled={saving} onClick={() => void saveProfile()} className="mt-6 rounded-lg bg-[#85ed65] px-5 py-3 text-sm font-bold text-[#112516] disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar perfil'}</button>
      </section>
      <section className="rounded-lg border border-white/15 bg-[#14251e] p-6 sm:p-8"><h2 className="text-xl font-semibold">Alterar senha</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm">Senha atual<input type="password" autoComplete="current-password" value={password.currentPassword} onChange={event => setPassword({ ...password, currentPassword: event.target.value })} className={field}/></label><label className="text-sm">Nova senha<input type="password" autoComplete="new-password" value={password.newPassword} onChange={event => setPassword({ ...password, newPassword: event.target.value })} className={field}/></label><label className="text-sm">Confirmar nova senha<input type="password" autoComplete="new-password" value={password.confirmation} onChange={event => setPassword({ ...password, confirmation: event.target.value })} className={field}/></label></div><button type="button" disabled={saving} onClick={() => void changePassword()} className="mt-6 rounded-lg border border-[#85ed65] px-5 py-3 text-sm font-bold text-[#a9f58e] disabled:opacity-60">Atualizar senha</button></section>
    </>}
  </div></main>;
}
