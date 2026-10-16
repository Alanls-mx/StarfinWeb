import { Save, Settings, Shield, MessageSquare, Info, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminGetSettings, adminSaveSettings } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';
import { MediaPicker } from '../../components/admin/MediaPicker';

export function AdminSettingsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const result = await adminSaveSettings(token, settings);
      setSettings(result.settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#177F58] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações Globais</h1>
        <p className="text-gray-400">Gerencie identidade publicada, integrações e comportamentos do site.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="space-y-5 rounded-lg border border-white/15 bg-[#14251e] p-6">
          <h2 className="text-xl font-semibold">Identidade e metadados</h2>
          <p className="text-sm text-[#bdd2c5]">As mudanças aparecem no HTML e na navegação após recarregar, sem substituir a identidade após a página abrir.</p>
          <label className="block text-sm">Nome do site<input value={settings.siteName || ''} maxLength={80} onChange={event => setSettings({ ...settings, siteName: event.target.value })} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3" /></label>
          <label className="block text-sm">Descrição para mecanismos de busca<textarea value={settings.siteDescription || ''} maxLength={300} onChange={event => setSettings({ ...settings, siteDescription: event.target.value })} className="mt-2 min-h-20 w-full rounded-md border border-white/20 bg-[#0b1715] p-3" /></label>
          {token && <div className="grid gap-6 md:grid-cols-2"><MediaPicker token={token} label="Logotipo" value={settings.logoUrl || ''} onChange={logoUrl => setSettings({ ...settings, logoUrl })}/><MediaPicker token={token} label="Favicon" value={settings.faviconUrl || ''} onChange={faviconUrl => setSettings({ ...settings, faviconUrl })}/></div>}
          <label className="block text-sm">Texto do rodapé<input value={settings.footerText || ''} maxLength={200} onChange={event => setSettings({ ...settings, footerText: event.target.value })} className="mt-2 w-full rounded-md border border-white/20 bg-[#0b1715] p-3" /></label>
        </section>
        {/* Suporte & Contato */}
        <div className="bg-[#172822]/40 border border-[#177F58]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-[#A6F3C8]" />
            <h3 className="text-xl font-bold">Suporte & Contato</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">E-mail de Suporte</label>
              <input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Mercado Pago */}
        <div className="bg-[#172822]/40 border border-[#177F58]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-[#A6F3C8]" />
            <h3 className="text-xl font-bold">Configurações Mercado Pago</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl mb-6">
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
                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                placeholder={settings.mercadopagoTokenConfigured ? 'Token configurado — digite para substituir' : 'APP_USR-...'}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Public Key</label>
              <input
                value={settings.mercadopagoPublicKey || ''}
                onChange={(e) => setSettings({ ...settings, mercadopagoPublicKey: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                placeholder="APP_USR-..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Webhook URL (Opcional)</label>
              <input
                value={settings.mercadopagoWebhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, mercadopagoWebhookUrl: e.target.value })}
                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                placeholder="https://sua-api.com/api/webhooks/mercadopago"
              />
              <p className="mt-2 text-[10px] text-gray-500">
                Se deixado em branco, o sistema usará a URL padrão baseada no domínio atual.
              </p>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-[#172822]/40 border border-[#177F58]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[#A6F3C8]" />
            <h3 className="text-xl font-bold">Modo de Manutenção</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl">
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

        <div className="bg-[#172822]/40 border border-[#177F58]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-[#A6F3C8]" />
            <h3 className="text-xl font-bold">Newsletter</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl">
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
                  className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Último envio</label>
                <input
                  value={settings.newsletterLastSentISO ? new Date(settings.newsletterLastSentISO).toLocaleString() : '—'}
                  readOnly
                  className="w-full px-4 py-3 bg-[#0B1715]/40 border border-[#177F58]/10 rounded-xl text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-10 py-4 bg-gradient-to-r from-[#177F58] to-[#22A874] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#177F58]/40 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
