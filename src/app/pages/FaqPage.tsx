import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, MessageCircle } from 'lucide-react';

export function FaqPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'Geral',
      question: 'Como faço para baixar meus plugins após a compra?',
      answer: 'Após a confirmação do pagamento, você receberá um e-mail com os links para download. Você também pode acessar a seção "Minha Conta" no site para baixar seus plugins a qualquer momento.',
    },
    {
      id: 2,
      category: 'Pagamentos',
      question: 'Quais as formas de pagamento aceitas?',
      answer: 'Aceitamos cartões de crédito, PIX e boleto bancário através do Mercado Pago. Todas as transações são seguras e criptografadas.',
    },
    {
      id: 3,
      category: 'Licença',
      question: 'Posso usar um plugin em mais de um servidor?',
      answer: 'Cada licença de plugin é vinculada a uma chave de API que pode ser usada em um servidor por vez. Para múltiplos servidores, você precisará de licenças adicionais.',
    },
    {
      id: 4,
      category: 'Suporte',
      question: 'Como entro em contato com o suporte?',
      answer: 'Oferecemos suporte via ticket no nosso site e também através do nosso servidor no Discord para clientes premium.',
    },
    {
      id: 5,
      category: 'Premium',
      question: 'O plano premium dá acesso a todos os plugins?',
      answer: 'Sim! O plano Starfin Premium dá acesso ilimitado a todos os plugins da nossa loja enquanto sua assinatura estiver ativa.',
    },
  ];

  const filteredFaqs = faqs.filter(
    faq => faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Perguntas Frequentes</h1>
        <p className="text-gray-400">Tire suas dúvidas rápidas sobre nossos serviços.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text"
          placeholder="Pesquisar dúvidas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#13131A] border border-[#7B2CBF]/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#7B2CBF] transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq) => (
          <div 
            key={faq.id}
            className="bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-[#7B2CBF]/5 transition-all"
            >
              <span className="font-bold text-white pr-8">{faq.question}</span>
              {activeId === faq.id ? (
                <Minus className="w-5 h-5 text-[#C77DFF] flex-shrink-0" />
              ) : (
                <Plus className="w-5 h-5 text-gray-600 flex-shrink-0" />
              )}
            </button>
            
            <AnimatePresence>
              {activeId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 text-gray-400 leading-relaxed text-sm"
                >
                  <div className="pt-2 border-t border-[#7B2CBF]/10">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhuma pergunta encontrada para sua pesquisa.
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="mt-16 p-8 bg-gradient-to-r from-[#7B2CBF]/10 to-[#C77DFF]/5 border border-[#7B2CBF]/20 rounded-3xl text-center">
        <MessageCircle className="w-10 h-10 text-[#C77DFF] mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Ainda tem dúvidas?</h3>
        <p className="text-gray-400 text-sm mb-6">Estamos prontos para te ajudar com qualquer outra questão.</p>
        <button className="bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white px-8 py-3 rounded-xl font-bold transition-all">
          Abrir um Ticket
        </button>
      </div>
    </div>
  );
}
