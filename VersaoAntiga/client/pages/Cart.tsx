import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Cart() {
  const navigate = useNavigate();
  const { items: cartItems, updateQuantity, removeItem } = useCart();
  const { authFetch, user } = useAuth();
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  const goCheckout = () => {
    navigate("/checkout");
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-2">Carrinho de Compras</h1>
          <p className="text-muted-foreground mb-12">
            {cartItems.length} item{cartItems.length !== 1 ? "ns" : ""} no seu
            carrinho
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {cartItems.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <ShoppingCart
                    size={48}
                    className="mx-auto mb-4 text-muted-foreground"
                  />
                  <h2 className="text-2xl font-bold mb-2">
                    Seu carrinho está vazio
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Comece a comprar para adicionar itens ao seu carrinho
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    Continuar Comprando
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-lg p-6 flex items-start justify-between gap-6"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-muted-foreground text-sm">
                            R$ {item.price.toFixed(2)} cada
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-2 text-muted-foreground hover:text-foreground transition"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="px-4 py-2 font-semibold min-w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-2 text-muted-foreground hover:text-foreground transition"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <div className="text-right min-w-24">
                          <p className="font-bold text-lg">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            {cartItems.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

                  <div className="space-y-4 mb-6 pb-6 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Imposto (10%)
                      </span>
                      <span>R$ {tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>Total</span>
                    <span className="text-primary">R$ {grandTotal.toFixed(2)}</span>
                  </div>

                  <button onClick={goCheckout} className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold mb-3">
                    Ir para Checkout
                  </button>

                  <Link
                    to="/shop"
                    className="block w-full px-4 py-3 border border-border text-foreground rounded-lg hover:bg-card-foreground/5 transition text-center font-semibold"
                  >
                    Continuar Comprando
                  </Link>

                  {checkoutMsg && <p className="text-sm text-muted-foreground text-center mt-2">{checkoutMsg}</p>}
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Checkout seguro com Mercado Pago
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
