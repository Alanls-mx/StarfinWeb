import { Edit2, Plus, Trash2, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { adminAddCategory, adminDeleteCategory, adminListCategories, adminUpdateCategory, type PluginCategory } from '../../lib/api';
import { toast } from 'sonner';

export function AdminCategoriesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<PluginCategory[]>([]);
  const [newName, setNewName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const res = await adminListCategories(token);
      if (!cancelled) setItems(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleUpdate = async (oldName: string) => {
    if (!token || !editValue.trim() || editValue.trim() === oldName) {
      setEditingItem(null);
      return;
    }
    try {
      await adminUpdateCategory(token, oldName, editValue.trim());
      const res = await adminListCategories(token);
      setItems(res.items);
      setEditingItem(null);
      toast.success('Categoria atualizada com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar categoria.');
    }
  };

  if (!token) {
    return (
      <div className="text-center text-gray-400 py-20">
        Faça login como admin para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Categorias</h1>
        <p className="text-sm text-gray-400">Gerencie as categorias de plugins disponíveis no site.</p>
      </div>

      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nova categoria"
            className="flex-1 px-4 py-3 bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!newName.trim()}
            onClick={async () => {
              try {
                await adminAddCategory(token, newName.trim() as any);
                const res = await adminListCategories(token);
                setItems(res.items);
                setNewName('');
                toast.success('Categoria adicionada com sucesso!');
              } catch (e) {
                console.error(e);
                toast.error('Erro ao adicionar categoria.');
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Adicionar
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <div key={c} className="flex items-center justify-between p-4 bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-xl hover:border-[#7B2CBF]/30 transition-all group">
              {editingItem === c ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(c)}
                    className="flex-1 px-3 py-2 bg-[#0B0B0F] border border-[#7B2CBF]/40 rounded-lg text-white outline-none focus:border-[#7B2CBF]"
                  />
                  <button onClick={() => handleUpdate(c)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingItem(null)} className="p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-white font-medium">{c}</div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingItem(c);
                        setEditValue(c);
                      }}
                      className="p-2 text-gray-400 hover:text-[#C77DFF] hover:bg-[#7B2CBF]/10 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Excluir a categoria "${c}"?`)) return;
                        await adminDeleteCategory(token, c);
                        const res = await adminListCategories(token);
                        setItems(res.items);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

