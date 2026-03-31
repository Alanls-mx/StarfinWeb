import Layout from "@/components/Layout";
import { Link, useSearchParams } from "react-router-dom";

export default function ThankYou() {
  const [params] = useSearchParams();
  const ordersParam = params.get("orders") || "";
  const orders = ordersParam ? ordersParam.split(",") : [];
  return (
    <Layout>
      <div className="min-h-screen py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Pagamento aprovado!</h1>
            <p className="text-muted-foreground mb-6">Obrigado pela sua compra. Suas licenças serão disponibilizadas na Área do Cliente em instantes.</p>
            {orders.length > 0 && (
              <p className="text-sm text-muted-foreground mb-6">Pedidos: {orders.join(", ")}</p>
            )}
            <div className="flex gap-3 justify-center">
              <Link to="/area-do-cliente" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Ir para Área do Cliente</Link>
              <Link to="/shop" className="px-4 py-2 border border-border rounded-lg">Continuar Comprando</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
