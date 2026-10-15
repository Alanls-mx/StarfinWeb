import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, MessageCircle } from 'lucide-react';
import { Link } from 'react-router';

export function FaqPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'Geral',
      question: 'Quando a licença aparece após a compra?',
      answer: 'A licença aparece na sua conta depois que o provedor confirma o pagamento. Um pedido pendente não libera o produto. O download do arquivo ainda não está disponível nesta plataforma.',
    },
    {
      id: 2,
      category: 'Pagamentos',
      question: 'Quais as formas de pagamento aceitas?',
      answer: 'As opções disponíveis são apresentadas pelo Mercado Pago durante o checkout. Consulte o status do pedido na sua conta após retornar do provedor.',
    },
    {
      id: 3,
      category: 'Licença',
      question: 'Posso usar um plugin em mais de um servidor?',
      answer: 'A autorização depende das licenças da conta e das atribuições configuradas para cada servidor. Cadastre os servidores e confira as regras de IP na sua conta.',
    },
    {
      id: 4,
      category: 'Suporte',
      question: 'Como entro em contato com o suporte?',
      answer: 'Abra um chamado na área de suporte do site e acompanhe as respostas pela sua conta.',
    },
    {
      id: 5,
      category: 'Premium',
      question: 'Posso assinar o plano Premium agora?',
      answer: 'A contratação de planos está indisponível até a homologação financeira. Os produtos disponíveis podem ser consultados individualmente no catálogo.',
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
        <Link to="/support" className="inline-block bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white px-8 py-3 rounded-xl font-bold transition-all">
          Abrir um Ticket
        </Link>
      </div>
    </div>
  );
}
