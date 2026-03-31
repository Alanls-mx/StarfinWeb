import { Mail, Save, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminGetOutbox, adminGetSmtp, adminSaveSmtp, adminTestSmtp, type OutboxEmail, type SmtpConfig } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminSmtpPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [cfg, setCfg] = useState<SmtpConfig | null>(null);
  const [testTo, setTestTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [outbox, setOutbox] = useState<OutboxEmail[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const [smtp, ob] = await Promise.all([adminGetSmtp(token), adminGetOutbox(token)]);
      if (!cancelled) {
        setCfg(smtp);
        setOutbox(ob.items);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-gray-400">Faça login como admin para acessar.</div>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">SMTP</h1>
          <p className="text-sm text-gray-400">Configure envio de emails de verificação, compras e suporte.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-5 h-5 text-[#C77DFF]" />
              <div className="text-white text-lg">Configuração</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-400">
                Ativo
                <select
                  value={cfg.enabled ? '1' : '0'}
                  onChange={(e) => setCfg({ ...cfg, enabled: e.target.value === '1' })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                >
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </select>
              </label>
              <label className="text-sm text-gray-400">
                Secure
                <select
                  value={cfg.secure ? '1' : '0'}
                  onChange={(e) => setCfg({ ...cfg, secure: e.target.value === '1' })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                >
                  <option value="0">TLS STARTTLS</option>
                  <option value="1">SSL</option>
                </select>
              </label>
              <label className="text-sm text-gray-400">
                Host
                <input
                  value={cfg.host}
                  onChange={(e) => setCfg({ ...cfg, host: e.target.value })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
              </label>
              <label className="text-sm text-gray-400">
                Porta
                <input
                  value={cfg.port}
                  onChange={(e) => setCfg({ ...cfg, port: Number(e.target.value) })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
              </label>
              <label className="text-sm text-gray-400">
                Usuário
                <input
                  value={cfg.user}
                  onChange={(e) => setCfg({ ...cfg, user: e.target.value })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
              </label>
              <label className="text-sm text-gray-400">
                Senha
                <input
                  value={cfg.pass}
                  onChange={(e) => setCfg({ ...cfg, pass: e.target.value })}
                  placeholder="********"
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
              </label>
              <label className="text-sm text-gray-400">
                From name
                <input
                  value={cfg.fromName}
                  onChange={(e) => setCfg({ ...cfg, fromName: e.target.value })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
              </label>
              <label className="text-sm text-gray-400">
                From email
                <input
                  value={cfg.fromEmail}
                  onChange={(e) => setCfg({ ...cfg, fromEmail: e.target.value })}
                  className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await adminSaveSmtp(token, cfg);
                    const smtp = await adminGetSmtp(token);
                    setCfg(smtp);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
              >
                <Save className="w-4 h-4" />
                Salvar
              </motion.button>
              <div className="flex-1 flex gap-2">
                <input
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="email para teste"
                  className="flex-1 px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!testTo.trim()}
                  onClick={async () => {
                    await adminTestSmtp(token, testTo.trim());
                    const ob = await adminGetOutbox(token);
                    setOutbox(ob.items);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#0B0B0F] rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                  Testar
                </motion.button>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-7">
            <div className="text-white text-lg mb-4">Outbox (últimos 50)</div>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {outbox.map((m) => (
                <div key={m.id} className="p-4 bg-[#0B0B0F]/50 rounded-xl border border-[#7B2CBF]/10">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="text-sm text-white truncate">{m.subject}</div>
                    <div className={`text-xs ${m.delivered ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {m.delivered ? 'enviado' : 'pendente'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{m.to}</div>
                  {m.error ? <div className="text-xs text-red-400 mt-2">{m.error}</div> : null}
                </div>
              ))}
              {!outbox.length ? <div className="text-sm text-gray-500">Nenhum email ainda.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

