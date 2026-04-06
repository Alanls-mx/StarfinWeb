import { Mail, MessageSquare, Shield, Send, Clock, CheckCircle2, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { createTicket, listMyTickets, type SupportTicket } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

export function SupportPage() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const token = state.status === 'authenticated' ? state.token : null;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Geral',
    priority: 'medium',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listMyTickets(token)
      .then(res => setTickets(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const created = await createTicket(token, newTicket);
      setTickets(prev => [created, ...prev]);
      setIsCreating(false);
      setNewTicket({ subject: '', category: 'Geral', priority: 'medium', message: '' });
      toast.success('Ticket criado com sucesso!');
      navigate(`/support/ticket/${created.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao abrir ticket. Verifique os campos.');
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status !== 'authenticated') {
    return (
      <div className="min-h-screen pt-32 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#7B2CBF]/20 flex items-center justify-center mb-6 text-[#C77DFF]">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Central de Suporte</h1>
        <p className="text-gray-400 mb-8 max-w-md">Você precisa estar logado para visualizar seus tickets ou abrir uma nova solicitação.</p>
        <Link 
          to="/login?redirect=/support"
          className="px-8 py-3 bg-[#7B2CBF] text-white rounded-xl font-bold hover:bg-[#9D4EDD] transition-all"
        >
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Suporte</h1>
            <p className="text-gray-400">Gerencie suas solicitações e tire dúvidas com nossa equipe.</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/support/ticket/${ticket.id}`}
                    className="block p-6 bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl hover:border-[#7B2CBF]/40 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          ticket.status === 'open' ? 'bg-blue-500/10 text-blue-400' :
                          ticket.status === 'answered' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {ticket.status === 'open' ? <Clock className="w-6 h-6" /> :
                           ticket.status === 'answered' ? <CheckCircle2 className="w-6 h-6" /> :
                           <Shield className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-white group-hover:text-[#C77DFF] transition-colors line-clamp-1">{ticket.subject}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="uppercase font-bold tracking-wider">{ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdISO).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`hidden sm:flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          ticket.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {ticket.priority}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
                {tickets.length === 0 && (
                  <div className="py-20 text-center text-gray-500 bg-[#1A1A22]/20 border border-dashed border-[#7B2CBF]/10 rounded-2xl">
                    Nenhum ticket encontrado.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#7B2CBF]/15 to-[#3C096C]/10 backdrop-blur-sm border border-[#7B2CBF]/25 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#C77DFF]" />
              </div>
              <div className="text-xl text-white mb-2">Dicas rápidas</div>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C77DFF] mt-0.5" />
                  <span>Inclua a versão do Minecraft e do plugin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C77DFF] mt-0.5" />
                  <span>Se possível, envie logs e prints do console.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C77DFF] mt-0.5" />
                  <span>Para problemas de licença, inclua a chave.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-7">
              <div className="text-xl text-white mb-2">Status</div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tickets Abertos</span>
                  <span className="text-white font-bold">{tickets.filter(t => t.status === 'open').length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Plano Atual</span>
                  <span className={`font-bold ${state.user?.plan === 'Premium' ? 'text-amber-400' : 'text-[#C77DFF]'}`}>
                    {state.user?.plan || 'Free'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#7B2CBF]/10">
                <h3 className="text-xl text-white font-bold">Abrir Novo Ticket</h3>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Categoria</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    >
                      <option value="Geral">Geral</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Plugins">Plugins</option>
                      <option value="Licenças">Licenças</option>
                      <option value="Sugestão">Sugestão</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Prioridade</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Assunto</label>
                  <input
                    required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    placeholder="Ex: Não recebi minha licença"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mensagem</label>
                  <textarea
                    required
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-32"
                    placeholder="Descreva detalhadamente seu problema..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Enviando...' : 'Criar Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
