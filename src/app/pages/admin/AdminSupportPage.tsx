import { Clock, CheckCircle2, Shield, Search, ChevronRight, User, Mail, Send, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import { adminListTickets, adminReplyToTicket, adminUpdateTicket, getTicket, type SupportTicket } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminSupportPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedArticle] = useState<SupportTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminListTickets(token)
      .then(res => setTickets(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedTicket?.messages]);

  const fetchTicketDetail = async (id: string) => {
    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await getTicket(token, id);
      setSelectedArticle(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      const msg = await adminReplyToTicket(token, selectedTicket.id, reply.trim());
      setSelectedArticle({
        ...selectedTicket,
        status: 'answered',
        messages: [...(selectedTicket.messages || []), msg]
      });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'answered' } : t));
      setReply('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (!token) return;
    try {
      await adminUpdateTicket(token, id, status);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
      if (selectedTicket?.id === id) {
        setSelectedArticle({ ...selectedTicket, status: status as any });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Suporte e Tickets</h1>
        <p className="text-gray-400">Gerencie todas as solicitações de suporte dos usuários.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
        {/* List Column */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-[#7B2CBF]/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tickets..."
                className="w-full pl-10 pr-4 py-2 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-sm text-white focus:border-[#7B2CBF] outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-3 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="divide-y divide-[#7B2CBF]/5">
                {filteredTickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => fetchTicketDetail(t.id)}
                    className={`w-full p-4 text-left hover:bg-[#7B2CBF]/5 transition-all group ${selectedTicket?.id === t.id ? 'bg-[#7B2CBF]/10' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                        t.status === 'answered' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">#{t.id.slice(-6)}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#C77DFF] line-clamp-1 mb-1 transition-colors">{t.subject}</h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span className="line-clamp-1">{t.user?.name}</span>
                      <span>{new Date(t.createdISO).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Column */}
        <div className="lg:col-span-2 bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedTicket ? (
            <>
              <div className="p-6 border-b border-[#7B2CBF]/10 bg-[#7B2CBF]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center text-white font-bold">
                    {selectedTicket.user?.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{selectedTicket.user?.name}</span>
                      <span>•</span>
                      <span>{selectedTicket.user?.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#7B2CBF]"
                  >
                    <option value="open">Aberto</option>
                    <option value="answered">Respondido</option>
                    <option value="closed">Fechado</option>
                  </select>
                </div>
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20"
              >
                {selectedTicket.messages?.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.isAdmin ? 'bg-[#7B2CBF] text-white' : 'bg-[#1A1A22] text-gray-500 border border-[#7B2CBF]/20'
                    }`}>
                      {msg.isAdmin ? 'S' : <User className="w-4 h-4" />}
                    </div>
                    <div className={`flex flex-col max-w-[80%] ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        msg.isAdmin ? 'bg-[#7B2CBF]/20 text-white border border-[#7B2CBF]/30 rounded-tr-none' : 'bg-[#1A1A22]/60 text-gray-300 border border-[#7B2CBF]/10 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="mt-1 text-[9px] text-gray-600 uppercase">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-[#7B2CBF]/10 bg-[#0B0B0F]/40">
                <form onSubmit={handleReply} className="relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="w-full pl-4 pr-14 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-sm text-white focus:border-[#7B2CBF] outline-none min-h-[80px] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="absolute right-3 bottom-3 p-2.5 bg-[#7B2CBF] text-white rounded-lg hover:bg-[#9D4EDD] transition-all disabled:opacity-50 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 rounded-2xl bg-[#7B2CBF]/10 flex items-center justify-center mb-4 text-[#7B2CBF]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Selecione um ticket</h3>
              <p className="text-gray-500 max-w-xs">Escolha um ticket na lista ao lado para visualizar o histórico e responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
