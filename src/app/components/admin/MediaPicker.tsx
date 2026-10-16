import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { adminListMedia, adminUploadFile } from '../../lib/api';

type MediaItem = { url: string; createdAt: string };

export function MediaPicker({ token, value, onChange, label }: { token: string; value: string; onChange: (url: string) => void; label: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminListMedia(token).then(result => { if (active) setItems(result.items); })
      .catch(() => { if (active) setError('Não foi possível carregar a biblioteca de mídia.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Use PNG, JPG, WEBP ou GIF com até 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const result = await adminUploadFile(token, file);
      setItems(current => [{ url: result.url, createdAt: new Date().toISOString() }, ...current]);
      onChange(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }

  return <div className="space-y-3 text-sm">
    <span className="block font-medium text-white">{label}</span>
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-[#0b1715]">
        {value ? <img src={value} alt="Imagem selecionada" className="h-full w-full object-contain" /> : <ImagePlus size={26} className="text-[#85ed65]" />}
      </div>
      <label className="cursor-pointer rounded-lg bg-[#85ed65] px-4 py-2.5 font-bold text-[#112516] hover:bg-[#a9f58e]">
        {uploading ? 'Enviando...' : 'Enviar imagem'}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} className="sr-only" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} />
      </label>
      {value && <button type="button" onClick={() => onChange('')} className="text-[#bdd2c5] underline">Remover seleção</button>}
    </div>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {loading ? <p className="text-[#bdd2c5]">Carregando mídia...</p> : items.length > 0 && <div className="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-white/10 p-2 sm:grid-cols-6" aria-label="Biblioteca de mídia">
      {items.map(item => <button key={item.url} type="button" onClick={() => onChange(item.url)} aria-label={`Selecionar imagem de ${new Date(item.createdAt).toLocaleDateString('pt-BR')}`} aria-pressed={value === item.url} className={`aspect-square overflow-hidden rounded-md border-2 ${value === item.url ? 'border-[#85ed65]' : 'border-transparent hover:border-white/40'}`}><img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" /></button>)}
    </div>}
  </div>;
}
