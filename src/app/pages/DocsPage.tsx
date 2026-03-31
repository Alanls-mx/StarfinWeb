import { BookOpen, KeyRound, PlugZap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getDocs, type DocsSection, type IntegrationConfig } from '../lib/api';

export function DocsPage() {
  const [sections, setSections] = useState<DocsSection[]>([]);
  const [integration, setIntegration] = useState<IntegrationConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getDocs();
      if (cancelled) return;
      setSections(res.items);
      setIntegration(res.integration);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Documentação</h1>
          <p className="text-gray-400 text-lg">
            Guias para compradores e desenvolvedores: instalação, licenças, integrações e API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {[
            { icon: BookOpen, title: 'Guia de Instalação', desc: 'Do download à configuração no servidor.' },
            { icon: ShieldCheck, title: 'Licenças', desc: 'Como validar licenças e manter seu servidor seguro.' },
            { icon: PlugZap, title: 'Integração', desc: 'Conecte plugins ao painel e automatize operações.' }
          ].map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.14) }}
              className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-7 hover:border-[#7B2CBF]/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center mb-4">
                <card.icon className="w-6 h-6 text-[#C77DFF]" />
              </div>
              <div className="text-xl text-white mb-2">{card.title}</div>
              <div className="text-sm text-gray-400">{card.desc}</div>
            </motion.div>
          ))}
        </div>

        <div id="api" className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-[#C77DFF]" />
            </div>
            <div>
              <h2 className="text-2xl text-white mb-1">API de Conexão & Autenticação</h2>
              <p className="text-sm text-gray-400">
                Use a chave de API do usuário + licença para autenticar seu plugin (Minecraft) e liberar recursos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-white">1) Gerar token de sessão (painel)</div>
              <pre className="bg-[#0B0B0F]/70 border border-[#7B2CBF]/10 rounded-xl p-4 overflow-auto text-sm">
                <code>{`POST /api/auth/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "sua-senha"
}`}</code>
              </pre>
              <div className="text-white">2) Criar chave de API (painel)</div>
              <pre className="bg-[#0B0B0F]/70 border border-[#7B2CBF]/10 rounded-xl p-4 overflow-auto text-sm">
                <code>{`POST /api/users/me/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "pluginId": 1,
  "name": "Servidor Principal"
}`}</code>
              </pre>
            </div>

            <div className="space-y-4">
              <div className="text-white">3) Validar no servidor (plugin Minecraft)</div>
              <pre className="bg-[#0B0B0F]/70 border border-[#7B2CBF]/10 rounded-xl p-4 overflow-auto text-sm">
                <code>{`POST /api/plugin-auth/verify
Content-Type: application/json

{
  "pluginId": 1,
  "apiKey": "sk_live_xxx",
  "licenseKey": "XXXX-XXXX-XXXX-1234",
  "serverId": "meu-servidor-01"
}`}</code>
              </pre>
              <div className="text-white">Resposta</div>
              <pre className="bg-[#0B0B0F]/70 border border-[#7B2CBF]/10 rounded-xl p-4 overflow-auto text-sm">
                <code>{`{
  "ok": true,
  "userId": "user_demo_1",
  "plan": "Premium",
  "licenseStatus": "Ativo"
}`}</code>
              </pre>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/account"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
            >
              Abrir Minha Conta
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-[#7B2CBF] text-white rounded-xl hover:bg-[#7B2CBF]/10 hover:border-[#C77DFF] transition-all duration-300"
            >
              Falar com Suporte
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-8">
            <h2 className="text-2xl text-white mb-2">Integrações (atual)</h2>
            <p className="text-sm text-gray-400 mb-6">Valores configurados no painel admin.</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Painel</span>
                <span className="text-white break-all">{integration?.panelBaseUrl ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Auth plugin</span>
                <span className="text-white break-all">{integration?.pluginAuthEndpoint ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Docs</span>
                <span className="text-white break-all">{integration?.docsBaseUrl ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-8">
            <h2 className="text-2xl text-white mb-2">Seções</h2>
            <p className="text-sm text-gray-400 mb-6">Conteúdo gerenciado pelo painel admin.</p>
            <div className="space-y-3">
              {sections.map((s) => (
                <div key={s.id} className="p-4 bg-[#0B0B0F]/50 rounded-xl border border-[#7B2CBF]/10">
                  <div className="text-white">{s.title}</div>
                  <div className="text-xs text-gray-500 mb-2">id: {s.id}</div>
                  <div className="text-sm text-gray-400 line-clamp-3 whitespace-pre-wrap">{s.body}</div>
                </div>
              ))}
              {!sections.length ? <div className="text-sm text-gray-500">Sem seções cadastradas.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
