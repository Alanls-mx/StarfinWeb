import { Crown, Check, Zap, Shield, Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router';
import { useCart } from '../lib/cart';
import { toast } from 'sonner';

export function PremiumPage() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const benefits = [
    'Acesso ilimitado a todos os plugins',
    'Download instantâneo de novos lançamentos',
    'Suporte prioritário via Discord e Ticket',
    'Distintivo exclusivo no perfil e Discord',
    'Acesso antecipado a versões Beta',
    'Descontos em serviços de parceiros'
  ];

  const handleSubscribe = () => {
    if (state.status !== 'authenticated') {
      navigate('/login?redirect=/premium');
      return;
    }
    
    addItem({
      id: 'premium',
      name: 'Starfin Premium',
      price: 4990,
      slug: 'premium',
      type: 'plan'
    });
    
    toast.success('Plano Premium adicionado ao carrinho!');
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-bold uppercase tracking-wider mb-6"
          >
            <Crown className="w-4 h-4" />
            Starfin Premium
          </motion.div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Um Plano. Todos os Plugins.
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Eleve seu servidor ao próximo nível com acesso total ao nosso ecossistema de ferramentas e plugins premium.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Benefits List */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Por que ser Premium?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-gray-300">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#C77DFF]" />
                </div>
                <div>
                  <h4 className="font-bold">Economia Real</h4>
                  <p className="text-sm text-gray-500">Mais de R$ 1.500,00 em plugins incluídos.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#7B2CBF] to-[#C77DFF] rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#13131A] border border-[#7B2CBF]/30 rounded-[2rem] p-10 overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <Crown className="w-24 h-24 text-[#7B2CBF]/5 -rotate-12" />
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Plano Mensal</h3>
                <p className="text-gray-500">Renovação automática, cancele quando quiser.</p>
              </div>

              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-6xl font-bold text-white">R$ 49</span>
                <span className="text-2xl text-gray-500">,90/mês</span>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-gray-300">
                  <Shield className="w-5 h-5 text-[#C77DFF]" />
                  <span>Pagamento 100% Seguro</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Star className="w-5 h-5 text-[#C77DFF]" />
                  <span>Acesso Imediato</span>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                className="w-full py-5 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[#7B2CBF]/40 transition-all flex items-center justify-center gap-3 group"
              >
                Assinar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="mt-6 text-center text-xs text-gray-500">
                Ao assinar, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
