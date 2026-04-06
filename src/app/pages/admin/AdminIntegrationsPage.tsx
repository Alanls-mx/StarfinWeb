import { Link2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminGetIntegrations, adminSaveIntegrations, type IntegrationConfig } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

export function AdminIntegrationsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [cfg, setCfg] = useState<IntegrationConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const res = await adminGetIntegrations(token);
      if (!cancelled) setCfg(res);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="text-center text-gray-400 py-20">Faça login como admin para acessar.</div>
    );
  }

  if (!cfg) {
    return (
      <div className="text-center text-gray-400 py-20">Carregando...</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Integrações</h1>
        <p className="text-sm text-gray-400">Configure URLs usadas no painel, docs e validação de plugins.</p>
      </div>

      <div className="max-w-4xl">

        <div className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-7">
          <div className="flex items-center gap-2 mb-6">
            <Link2 className="w-5 h-5 text-[#C77DFF]" />
            <div className="text-white text-lg">Configuração</div>
          </div>

          <div className="space-y-4">
            <label className="text-sm text-gray-400">
              URL do Painel
              <input
                value={cfg.panelBaseUrl}
                onChange={(e) => setCfg({ ...cfg, panelBaseUrl: e.target.value })}
                className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
              />
            </label>
            <label className="text-sm text-gray-400">
              Endpoint de autenticação do plugin
              <input
                value={cfg.pluginAuthEndpoint}
                onChange={(e) => setCfg({ ...cfg, pluginAuthEndpoint: e.target.value })}
                className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
              />
            </label>
            <label className="text-sm text-gray-400">
              URL base da documentação
              <input
                value={cfg.docsBaseUrl}
                onChange={(e) => setCfg({ ...cfg, docsBaseUrl: e.target.value })}
                className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await adminSaveIntegrations(token, cfg);
                  toast.success('Integrações salvas com sucesso!');
                } catch (e) {
                  console.error(e);
                  toast.error('Erro ao salvar integrações.');
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
            >
              <Save className="w-4 h-4" />
              Salvar
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

