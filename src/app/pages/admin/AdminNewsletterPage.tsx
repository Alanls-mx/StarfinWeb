
import { Mail, Send, Users, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminListNewsletterSubscribers, adminSendNewsletter } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

export function AdminNewsletterPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminListNewsletterSubscribers(token)
      .then(res => setSubscribers(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !subject || !body) return;
    
    if (!window.confirm(`Tem certeza que deseja enviar este email para ${subscribers.length} inscritos?`)) {
      return;
    }

    setSending(true);
    try {
      await adminSendNewsletter(token, { subject, body });
      toast.success('Newsletter enviada com sucesso!');
      setSubject('');
      setBody('');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar newsletter.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Newsletter</h1>
        <p className="text-gray-400">Envie promoções, novidades e atualizações para seus inscritos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSend} className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-[#C77DFF]" />
              <h3 className="text-xl font-bold">Compor Email</h3>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Assunto do Email</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: 🚀 Promoção de Páscoa: 30% OFF em todos os plugins!"
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Conteúdo (HTML suportado)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Olá, temos novidades incríveis para você..."
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-[300px] font-mono text-sm"
                required
              />
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                O email será enviado dentro do layout padrão do site.
              </p>
            </div>

            <button
              type="submit"
              disabled={sending || !token || subscribers.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando para {subscribers.length} pessoas...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar para {subscribers.length} inscritos
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#C77DFF]" />
              <h3 className="font-bold text-lg">Inscritos</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl font-bold text-white">
                  {subscribers.length}
                </div>
                <p className="text-sm text-gray-400">
                  Total de usuários que aceitaram receber novidades por email.
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {subscribers.map((email, idx) => (
                    <div key={idx} className="text-xs text-gray-500 bg-[#0B0B0F] p-2 rounded border border-[#7B2CBF]/5 truncate">
                      {email}
                    </div>
                  ))}
                  {subscribers.length === 0 && (
                    <p className="text-xs text-gray-600 italic">Nenhum inscrito ainda.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold">Atenção</h4>
            </div>
            <p className="text-xs text-amber-400/70 leading-relaxed">
              Evite enviar muitos emails no mesmo dia para não cair na caixa de spam. 
              Certifique-se de que o conteúdo seja relevante para seus usuários.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
