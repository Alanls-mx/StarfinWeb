import { Mail, MessageSquare, Shield, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { createSupportTicket } from '../lib/api';

export function SupportPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<null | { id: string; status: string }>(null);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Suporte</h1>
          <p className="text-gray-400 text-lg">Abra um ticket e nossa equipe responde o mais rápido possível.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Assunto</div>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex: Problema ao ativar licença"
                      className="w-full pl-12 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-400">Mensagem</div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva seu problema, inclua nome do plugin e versão do Minecraft."
                  className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300 min-h-44"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting || !email.trim() || !subject.trim() || !message.trim()}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const res = await createSupportTicket({
                      email: email.trim(),
                      subject: subject.trim(),
                      message: message.trim()
                    });
                    setCreated(res);
                    setSubject('');
                    setMessage('');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-xl hover:shadow-[#7B2CBF]/50 transition-all duration-300 disabled:opacity-60"
              >
                <Send className="w-5 h-5" />
                Enviar Ticket
              </motion.button>

              {created ? (
                <div className="text-sm text-emerald-400">
                  Ticket criado: {created.id} ({created.status})
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#7B2CBF]/15 to-[#3C096C]/10 backdrop-blur-sm border border-[#7B2CBF]/25 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#C77DFF]" />
              </div>
              <div className="text-xl text-white mb-2">Dicas rápidas</div>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>Inclua a versão do Minecraft e do plugin.</li>
                <li>Se possível, envie logs e prints do console.</li>
                <li>Para problemas de licença, inclua a chave (sem expor em público).</li>
              </ul>
            </div>

            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-7">
              <div className="text-xl text-white mb-2">Horário</div>
              <div className="text-sm text-gray-400">Atendimento 24/7 para membros Premium.</div>
              <div className="text-sm text-gray-400 mt-2">Atendimento comercial para planos Free.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

