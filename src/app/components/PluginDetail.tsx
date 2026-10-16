import { ArrowLeft, ArrowRight, Box, Check, ShoppingBag, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { getPlugin, postReview, type PluginDetail as Product } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

const panel = 'rounded-2xl border border-[#345e49] bg-[#172c23] p-6 sm:p-8';

export function PluginDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const { state } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'gallery' | 'reviews'>('overview');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setProduct(null);
    if (!Number.isSafeInteger(productId) || productId <= 0) { setError('Produto inválido.'); setLoading(false); return; }
    getPlugin(productId)
      .then(data => { if (active) setProduct(data); })
      .catch(() => { if (active) setError('Este produto não está disponível.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || state.status !== 'authenticated' || sending) return;
    setSending(true);
    try {
      await postReview(state.token, { pluginId: product.id, rating, comment: comment.trim() });
      setProduct(await getPlugin(product.id));
      setComment('');
      toast.success('Avaliação registrada');
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Não foi possível avaliar o produto.'); }
    finally { setSending(false); }
  }

  return <main className="mx-auto min-h-[75vh] max-w-7xl px-5 pb-24 pt-32 sm:px-8">
    <Link to="/plugins" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white"><ArrowLeft size={16}/> Voltar ao catálogo</Link>
    {loading ? <div role="status" className="mt-10 grid gap-5 lg:grid-cols-[1fr_340px]"><div className="h-[400px] animate-pulse rounded-xl bg-card"/><div className="h-[320px] animate-pulse rounded-xl bg-card"/></div>
    : error || !product ? <div className="mt-10 border-l-2 border-[#85ed65] bg-[#14251e] p-8 text-white" role="alert"><h1 className="text-2xl font-bold">Produto indisponível</h1><p className="mt-3 text-[#bdd2c5]">{error}</p><Link to="/plugins" className="mt-6 inline-flex font-bold text-[#a9f58e] hover:underline">Voltar ao catálogo →</Link></div>
    : <>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-white/15 bg-[#14251e] p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[#a9f58e]"><span>{product.category}</span>{product.platform && <span>/ {product.platform}</span>}</div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-.06em] sm:text-5xl">{product.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#bdd2c5]">{product.tagline || product.description}</p>
          <div className="mt-7 overflow-hidden rounded-lg border border-white/15 bg-[#0b1715]">
            {product.imageUrl ? <img src={product.imageUrl} alt={`Imagem de ${product.name}`} className="aspect-[16/8] w-full object-cover"/> : <div className="flex aspect-[16/8] items-center justify-center"><Box size={46} className="text-[#85ed65]"/></div>}
          </div>
          </div>
          <div className="mt-10 flex gap-6 overflow-x-auto border-b border-white/10" role="tablist" aria-label="Informações do produto">
            {(['overview', 'gallery', 'reviews'] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} type="button" onClick={() => setTab(value)} className={`border-b-2 pb-4 text-sm font-medium ${tab === value ? 'border-primary text-white' : 'border-transparent text-muted-foreground hover:text-white'}`}>{value === 'overview' ? 'Visão geral' : value === 'gallery' ? 'Galeria' : 'Avaliações'}</button>)}
          </div>
          <div className={`${panel} mt-6`} role="tabpanel">
            {tab === 'overview' && <div className="space-y-9">
              <section><h2 className="text-xl font-semibold">Sobre o plugin</h2><p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{product.description}</p></section>
              {product.features.length > 0 && <section><h2 className="text-xl font-semibold">Recursos</h2><ul className="mt-5 grid gap-4 sm:grid-cols-2">{product.features.map(feature => <li key={feature.title} className="flex gap-3 rounded-lg border border-white/10 p-4"><Check size={18} className="mt-1 shrink-0 text-primary"/><span><strong className="block text-sm">{feature.title}</strong><small className="mt-1 block leading-6 text-muted-foreground">{feature.description}</small></span></li>)}</ul></section>}
              {product.dependencies.length > 0 && <section><h2 className="text-xl font-semibold">Dependências</h2><p className="mt-3 text-muted-foreground">{product.dependencies.join(', ')}</p></section>}
              <Link to="/docs" className="inline-flex text-sm font-semibold text-primary hover:text-white">Consultar documentação →</Link>
            </div>}
            {tab === 'gallery' && (product.screenshots.length > 0 ? <div className="grid gap-4 sm:grid-cols-2">{product.screenshots.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${product.name}: captura ${index + 1}`} className="aspect-video w-full rounded-lg border border-white/10 object-cover"/>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma captura publicada para este produto.</p>)}
            {tab === 'reviews' && <div className="space-y-7">
              <h2 className="text-xl font-semibold">Avaliações {product.reviewsCount > 0 && <span className="text-sm font-normal text-muted-foreground">({product.reviewsCount})</span>}</h2>
              {state.status === 'authenticated' ? <form onSubmit={submitReview} className="space-y-3 rounded-lg border border-white/10 p-5"><label htmlFor="rating" className="block text-sm">Sua nota</label><select id="rating" value={rating} onChange={event => setRating(Number(event.target.value))} className="rounded-lg border border-input bg-input-background px-3 py-2 text-sm">{[5,4,3,2,1].map(value => <option key={value} value={value}>{value} estrela{value > 1 ? 's' : ''}</option>)}</select><label htmlFor="review" className="block text-sm">Seu comentário</label><textarea id="review" required minLength={3} value={comment} onChange={event => setComment(event.target.value)} className="min-h-24 w-full rounded-lg border border-input bg-input-background p-3 text-sm"/><button disabled={sending} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{sending ? 'Enviando...' : 'Publicar avaliação'}</button></form> : <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Entre na sua conta</Link> para avaliar.</p>}
              {product.reviews.length > 0 ? <ul className="divide-y divide-white/10">{product.reviews.map((review, index) => <li key={index} className="py-5"><div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm">{review.user}</strong><span className="inline-flex items-center gap-1 text-sm text-amber-300"><Star size={14} fill="currentColor"/> {review.rating}/5</span></div><p className="mt-2 text-sm leading-7 text-muted-foreground">{review.comment}</p><time className="mt-2 block text-xs text-muted-foreground">{review.dateISO}</time></li>)}</ul> : <p className="text-sm text-muted-foreground">Este produto ainda não recebeu avaliações.</p>}
            </div>}
          </div>
        </div>
        <aside className="lg:pt-3"><div className="sticky top-28 space-y-6 rounded-lg border border-white/15 bg-[#14251e] p-6 text-white sm:p-8">
          <div><p className="font-mono text-xs text-[#a9f58e]">{product.tags.includes('Free') ? 'PLUGIN FREE' : 'LICENÇA DO PRODUTO'}</p><p className="mt-2 text-3xl font-extrabold">{product.tags.includes('Free') ? 'Grátis' : product.priceDisplay}</p></div>
          {product.tags.includes('Free') ? <Link to={state.status === 'authenticated' ? '/account/servers' : '/login?next=/account/servers'} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Usar plugin Free <ArrowRight size={17}/></Link> : <button type="button" onClick={() => { addItem({ id: String(product.id), name: product.name, price: product.priceCents, slug: String(product.id), imageUrl: product.imageUrl }); toast.success('Adicionado ao carrinho'); }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><ShoppingBag size={17}/> Adicionar ao carrinho</button>}
          <dl className="divide-y divide-white/10 border-t border-white/10 text-sm"><div className="flex justify-between gap-3 py-3"><dt className="text-[#bdd2c5]">Versão</dt><dd>{product.version || 'Não informada'}</dd></div><div className="flex justify-between gap-3 py-3"><dt className="text-[#bdd2c5]">Minecraft</dt><dd>{product.mcVersion || 'Consultar suporte'}</dd></div><div className="flex justify-between gap-3 py-3"><dt className="text-[#bdd2c5]">Desenvolvedor</dt><dd>{product.author || 'StarfinPlugins'}</dd></div>{product.reviewsCount > 0 && <div className="flex justify-between gap-3 py-3"><dt className="text-[#bdd2c5]">Avaliação</dt><dd>{product.rating}/5</dd></div>}</dl>
          <p className="text-xs leading-6 text-[#bdd2c5]">{product.tags.includes('Free') ? 'Instale em quantos servidores quiser após vincular o StarfinCore à sua conta.' : 'Após a confirmação do pagamento, consulte sua licença e a disponibilidade de arquivos na área da conta.'}</p>
        </div></aside>
      </div>
    </>}
  </main>;
}
