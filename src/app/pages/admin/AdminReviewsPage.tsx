import { Star, Trash2, Search, MessageSquare, Package, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminDeleteReview, adminListReviews } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

export function AdminReviewsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!token) return;
    loadReviews();
  }, [token]);

  const loadReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminListReviews(token);
      setReviews(res.items);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar avaliações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    
    try {
      await adminDeleteReview(token, id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Avaliação excluída com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir avaliação.');
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pluginName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar Avaliações</h1>
        <p className="text-gray-400">Visualize e modere as avaliações deixadas pelos usuários nos plugins.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por usuário, plugin ou comentário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 backdrop-blur-sm hover:border-[#7B2CBF]/30 transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7B2CBF]/10 rounded-lg border border-[#7B2CBF]/20">
                        <User className="w-4 h-4 text-[#C77DFF]" />
                        <span className="text-sm font-medium text-white">{review.userName}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#9D4EDD]/10 rounded-lg border border-[#9D4EDD]/20">
                        <Package className="w-4 h-4 text-[#E0AAFF]" />
                        <span className="text-sm font-medium text-white">{review.pluginName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdISO).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                      <p className="text-gray-300 italic">"{review.comment}"</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm group-hover:shadow-red-500/20"
                      title="Excluir avaliação"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredReviews.length === 0 && (
            <div className="text-center py-20 bg-[#1A1A22]/20 border border-dashed border-[#7B2CBF]/10 rounded-2xl">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma avaliação encontrada.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
