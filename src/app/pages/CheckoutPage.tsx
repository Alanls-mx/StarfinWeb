import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { apiFetch } from '../lib/api';
import { ShoppingBag, Tag, CreditCard, ChevronRight, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export function CheckoutPage() {
  const { items, removeItem, total, clearCart } = useCart();
  const { state } = useAuth();
  const navigate = useNavigate();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<{ code: string; discountCents: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtotal = total;
  const discount = couponData ? couponData.discountCents : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setError(null);
    try {
      const res = await apiFetch<{ code: string; discountCents: number }>('/api/commerce/coupon/validate', {
        method: 'POST',
        token: state.status === 'authenticated' ? state.token : null,
        body: JSON.stringify({ code: couponCode, totalCents: subtotal })
      });
      setCouponData(res);
    } catch (err: any) {
      if (err.status === 401) {
        setError('Você precisa estar logado para aplicar cupons.');
      } else {
        setError(err.message || 'Cupom inválido');
      }
      setCouponData(null);
    }
  };

  const handleCheckout = async () => {
    if (state.status !== 'authenticated') {
      navigate('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    setError(null);

    const pluginIds = items.filter(i => i.type !== 'plan').map(i => i.id);
    const planItem = items.find(i => i.type === 'plan');

    try {
      const res = await apiFetch<{ orderId: string; checkoutUrl: string }>('/api/commerce/checkout', {
        method: 'POST',
        token: state.status === 'authenticated' ? state.token : null,
        body: JSON.stringify({
          pluginIds,
          planId: planItem?.id,
          couponCode: couponData?.code
        })
      });

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }

      setSuccess(true);
      clearCart();
      setTimeout(() => {
        navigate('/account');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar checkout');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Compra Realizada com Sucesso!</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Seu pedido foi processado e suas licenças já estão disponíveis no seu painel. 
          Você também receberá um e-mail com os detalhes.
        </p>
        <button 
          onClick={() => navigate('/account')}
          className="bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Ir para Meus Plugins
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-400">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Início</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#7B2CBF]" />
            Seu Carrinho ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl p-12 text-center">
              <p className="text-gray-400 mb-6">Seu carrinho está vazio.</p>
              <button 
                onClick={() => navigate('/plugins')}
                className="bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white px-6 py-2 rounded-lg transition-all"
              >
                Ver Plugins
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-[#1A1A22] rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-gray-400">
                    {item.type === 'plan' ? 'Assinatura Mensal' : 'Licença Vitalícia'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#7B2CBF]">R$ {(item.price / 100).toFixed(2)}</p>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-[#13131A] border border-[#7B2CBF]/20 rounded-2xl p-6 sticky top-32">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#7B2CBF]" />
              Resumo do Pedido
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>R$ {(subtotal / 100).toFixed(2)}</span>
              </div>
              {couponData && (
                <div className="flex justify-between text-green-500">
                  <span>Desconto ({couponData.code})</span>
                  <span>- R$ {(discount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-[#7B2CBF]/10 my-2" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-[#7B2CBF]">R$ {(finalTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Tem um cupom?</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  className="bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#7B2CBF]"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-[#1A1A22] border border-[#7B2CBF]/20 hover:border-[#7B2CBF] px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Aplicar
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}
            </div>

            <button 
              disabled={items.length === 0 || loading}
              onClick={handleCheckout}
              className="w-full bg-[#7B2CBF] hover:bg-[#9D4EDD] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#7B2CBF]/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Processando...' : 'Finalizar Compra'}
            </button>
            
            <p className="text-[10px] text-gray-500 text-center mt-4">
              Ao finalizar a compra você concorda com nossos termos de serviço.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
