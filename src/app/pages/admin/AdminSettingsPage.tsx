import { Save, Settings, Shield, Globe, MessageSquare, Info, BarChart3, Upload, Loader2, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminGetSettings, adminSaveSettings, adminUploadFile } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

export function AdminSettingsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminGetSettings(token)
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await adminSaveSettings(token, settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const { url } = await adminUploadFile(token, file);
      setSettings({ ...settings, logoUrl: url });
      toast.success('Logo enviada com sucesso!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erro ao enviar logo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações Globais</h1>
        <p className="text-gray-400">Gerencie as informações principais e comportamentos do site.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Geral */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-[#C77DFF]" />
            <h3 className="text-xl font-bold">Informações do Site</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome do Site</label>
              <input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Logo do Site</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={settings.logoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    placeholder="URL da imagem..."
                  />
                </div>
                <label className="cursor-pointer px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-xl text-gray-400 hover:text-white hover:border-[#7B2CBF] transition-all flex items-center gap-2 min-w-fit">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#C77DFF]" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span>{uploading ? 'Enviando...' : 'Upload'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="mt-2 text-[10px] text-gray-500">
                Envie um arquivo local ou insira uma URL externa.
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">URL do Discord</label>
              <input
                value={settings.discordUrl}
                onChange={(e) => setSettings({ ...settings, discordUrl: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Descrição Curta (SEO)</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-20"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1A1A22] border border-[#7B2CBF]/20 flex items-center justify-center overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-7 h-7 border-2 border-white/40 rounded-sm" />
                )}
              </div>
              <div className="text-xs text-gray-500">
                Pré-visualização da logo usada no topo e no rodapé.
              </div>
            </div>
          </div>
        </div>

        {/* Suporte & Contato */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-[#C77DFF]" />
            <h3 className="text-xl font-bold">Suporte & Contato</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">E-mail de Suporte</label>
              <input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Texto do Rodapé</label>
              <input
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Estatísticas da Home */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#C77DFF]" />
            <h3 className="text-xl font-bold">Estatísticas da Página Inicial</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Plugins Premium (Ex: 500+)</label>
              <input
                value={settings.homeStatsPlugins}
                onChange={(e) => setSettings({ ...settings, homeStatsPlugins: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Servidores Ativos (Ex: 50K+)</label>
              <input
                value={settings.homeStatsServers}
                onChange={(e) => setSettings({ ...settings, homeStatsServers: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Avaliação Média (Ex: 4.9/5)</label>
              <input
                value={settings.homeStatsRating}
                onChange={(e) => setSettings({ ...settings, homeStatsRating: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Suporte (Ex: 24/7)</label>
              <input
                value={settings.homeStatsSupport}
                onChange={(e) => setSettings({ ...settings, homeStatsSupport: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Mercado Pago */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-[#C77DFF]" />
            <h3 className="text-xl font-bold">Configurações Mercado Pago</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl mb-6">
            <div>
              <div className="text-sm font-medium">Habilitar Mercado Pago</div>
              <div className="text-xs text-gray-500">Permite pagamentos via Mercado Pago no checkout.</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, mercadopagoEnabled: !settings.mercadopagoEnabled })}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.mercadopagoEnabled ? 'bg-[#009EE3]' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.mercadopagoEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Access Token</label>
              <input
                type="password"
                value={settings.mercadopagoAccessToken || ''}
                onChange={(e) => setSettings({ ...settings, mercadopagoAccessToken: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                placeholder="APP_USR-..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Public Key</label>
              <input
                value={settings.mercadopagoPublicKey || ''}
                onChange={(e) => setSettings({ ...settings, mercadopagoPublicKey: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                placeholder="APP_USR-..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Webhook URL (Opcional)</label>
              <input
                value={settings.mercadopagoWebhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, mercadopagoWebhookUrl: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                placeholder="https://sua-api.com/api/webhooks/mercadopago"
              />
              <p className="mt-2 text-[10px] text-gray-500">
                Se deixado em branco, o sistema usará a URL padrão baseada no domínio atual.
              </p>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[#C77DFF]" />
            <h3 className="text-xl font-bold">Modo de Manutenção</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Ativar Manutenção</div>
                <div className="text-xs text-gray-500">Bloqueia o acesso de usuários comuns ao site.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-[#C77DFF]" />
            <h3 className="text-xl font-bold">Newsletter</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl">
              <div>
                <div className="text-sm font-medium">Envio automático</div>
                <div className="text-xs text-gray-500">Dispara emails de promoções e novidades para inscritos.</div>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, newsletterAutoEnabled: !settings.newsletterAutoEnabled })}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.newsletterAutoEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.newsletterAutoEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Frequência (dias)</label>
                <input
                  type="number"
                  min={1}
                  value={settings.newsletterFrequencyDays ?? 7}
                  onChange={(e) => setSettings({ ...settings, newsletterFrequencyDays: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Último envio</label>
                <input
                  value={settings.newsletterLastSentISO ? new Date(settings.newsletterLastSentISO).toLocaleString() : '—'}
                  readOnly
                  className="w-full px-4 py-3 bg-[#0B0B0F]/40 border border-[#7B2CBF]/10 rounded-xl text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-10 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/40 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
