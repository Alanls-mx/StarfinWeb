import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export default function Checkout() {
  const { user, authFetch } = useAuth();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [results, setResults] = useState<{ licenseKey?: string }[]>([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const placeOrder = async () => {
    setBusy(true);
    setMsg(null);
    setResults([]);
    try {
      if (!user) {
        setMsg("Você precisa estar logado para finalizar a compra.");
        setBusy(false);
        return;
      }
      const res = await authFetch(`/api/payments/mercadopago/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ pluginId: i.id, quantity: i.quantity })) }),
      });
      const data = await res.json();
      if (!data.success || !data.initPoint) {
        const parts = [data.message || "Falha ao iniciar pagamento"];
        if (data?.error) parts.push(String(data.error));
        const detailId = data?.details?.id as string | undefined;
        if (detailId) parts.push(`ID preferência: ${detailId}`);
        setMsg(parts.join(" • "));
        setBusy(false);
        return;
      }
      clearCart();
      window.location.href = data.initPoint as string;
    } catch {
      setMsg("Erro ao processar checkout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>
          {items.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted-foreground">Seu carrinho está vazio.</p>
              <Link to="/shop" className="inline-block mt-4 px-4 py-2 border border-border rounded-lg">Voltar à Loja</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Itens</h2>
                <div className="space-y-3">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{i.name}</div>
                        <div className="text-xs text-muted-foreground">Qtd: {i.quantity}</div>
                      </div>
                      <div className="font-semibold">R$ {(i.price * i.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Resumo</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Imposto (10%)</span><span>R$ {tax.toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">R$ {total.toFixed(2)}</span></div>
                </div>
                <button disabled={busy} onClick={placeOrder} className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold">
                  {busy ? "Redirecionando..." : "Pagar com Mercado Pago"}
                </button>
                {msg && <p className="text-sm text-muted-foreground mt-2">{msg}</p>}
              </div>
            </div>
          )}

          {/* Após pagamento, o usuário será redirecionado para /obrigado */}
        </div>
      </div>
    </Layout>
  );
}
