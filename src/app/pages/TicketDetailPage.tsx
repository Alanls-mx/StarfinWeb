import { ArrowLeft, Clock, CheckCircle2, Shield, Send, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { getTicket, replyToTicket, closeTicket, type SupportTicket } from '../lib/api';
import { useAuth } from '../lib/auth';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAuth();
  const navigate = useNavigate();
  const token = state.status === 'authenticated' ? state.token : null;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    getTicket(token, id)
      .then(setTicket)
      .catch((err) => {
        console.error(err);
        navigate('/support');
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !message.trim()) return;
    setSending(true);
    try {
      const newMessage = await replyToTicket(token, id, message.trim());
      setTicket(prev => prev ? {
        ...prev,
        status: 'open',
        messages: [...(prev.messages || []), newMessage]
      } : null);
      setMessage('');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar resposta.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!token || !id || !window.confirm('Deseja realmente encerrar este ticket?')) return;
    try {
      await closeTicket(token, id);
      setTicket(prev => prev ? { ...prev, status: 'closed' } : null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/support" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para Suporte
        </Link>

        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
          {/* Header */}
          <div className="p-8 border-b border-[#7B2CBF]/10 bg-[#7B2CBF]/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ticket.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                  ticket.status === 'answered' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-gray-500/20 text-gray-500'
                }`}>
                  {ticket.status === 'open' ? 'Aberto' : ticket.status === 'answered' ? 'Respondido' : 'Fechado'}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-500 font-mono uppercase">#{ticket.id.slice(-6)}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{ticket.subject}</h1>
            </div>
            {ticket.status !== 'closed' && (
              <button
                onClick={handleClose}
                className="px-6 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all"
              >
                Encerrar Ticket
              </button>
            )}
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="p-8 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar bg-black/20"
          >
            {ticket.messages?.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-4 ${msg.isAdmin ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold shadow-lg ${
                  msg.isAdmin 
                    ? 'bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] text-white' 
                    : 'bg-[#1A1A22] text-gray-400 border border-[#7B2CBF]/20'
                }`}>
                  {msg.isAdmin ? 'S' : <User className="w-5 h-5" />}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`px-6 py-4 rounded-2xl text-sm leading-relaxed ${
                    msg.isAdmin 
                      ? 'bg-[#7B2CBF]/20 text-white border border-[#7B2CBF]/30 rounded-tr-none' 
                      : 'bg-[#1A1A22]/60 text-gray-300 border border-[#7B2CBF]/10 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="mt-2 text-[10px] text-gray-600 font-medium uppercase tracking-widest">
                    {msg.isAdmin ? 'Equipe Starfin' : 'Você'} • {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reply Area */}
          {ticket.status !== 'closed' ? (
            <div className="p-8 border-t border-[#7B2CBF]/10 bg-black/40">
              <form onSubmit={handleReply} className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="w-full pl-6 pr-16 py-4 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-2xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-24 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="absolute right-4 bottom-4 p-3 bg-[#7B2CBF] text-white rounded-xl hover:bg-[#9D4EDD] transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-110 active:scale-95 shadow-lg shadow-[#7B2CBF]/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8 border-t border-[#7B2CBF]/10 bg-red-500/5 text-center">
              <p className="text-red-400 text-sm font-medium">Este ticket está encerrado e não aceita mais respostas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
