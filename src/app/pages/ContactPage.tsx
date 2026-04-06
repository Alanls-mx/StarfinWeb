import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, MapPin, Phone, Github, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  const socials = [
    { name: 'Discord', icon: MessageCircle, color: '#5865F2', link: 'https://discord.gg/starfin' },
    { name: 'Instagram', icon: Instagram, color: '#E4405F', link: 'https://instagram.com/starfinplugins' },
    { name: 'Twitter', icon: Twitter, color: '#1DA1F2', link: 'https://twitter.com/starfinplugins' },
    { name: 'GitHub', icon: Github, color: '#333', link: 'https://github.com/starfin' },
  ];

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
        >
          Entre em Contato
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Tem alguma dúvida, sugestão ou precisa de um orçamento personalizado? 
          Estamos aqui para ajudar você a tirar seu projeto do papel.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-2 gap-16">
        {/* Contact Info */}
        <div className="space-y-10">
          <div>
            <h2 className="text-3xl font-bold mb-8">Informações</h2>
            <div className="space-y-6">
              {[
                { icon: Mail, label: 'E-mail', value: 'suporte@starfinplugins.com' },
                { icon: Phone, label: 'WhatsApp', value: '+55 (11) 99999-9999' },
                { icon: MapPin, label: 'Localização', value: 'São Paulo, Brasil - Atendimento Remoto' },
              ].map((info, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#7B2CBF]/10 flex items-center justify-center group-hover:bg-[#7B2CBF]/20 transition-all">
                    <info.icon className="w-5 h-5 text-[#C77DFF]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{info.label}</div>
                    <div className="text-white font-bold">{info.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Redes Sociais</h2>
            <div className="flex flex-wrap gap-4">
              {socials.map((social, i) => (
                <a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-[#13131A] border border-[#7B2CBF]/10 rounded-2xl hover:border-[#7B2CBF]/40 transition-all group"
                >
                  <social.icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: social.color }} />
                  <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-[#13131A] border border-[#7B2CBF]/20 rounded-3xl shadow-2xl shadow-[#7B2CBF]/5"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Seu Nome</label>
                <input 
                  required
                  type="text" 
                  placeholder="João Silva"
                  className="w-full bg-[#1A1A22] border border-[#7B2CBF]/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B2CBF] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Seu E-mail</label>
                <input 
                  required
                  type="email" 
                  placeholder="joao@exemplo.com"
                  className="w-full bg-[#1A1A22] border border-[#7B2CBF]/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B2CBF] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Assunto</label>
              <select className="w-full bg-[#1A1A22] border border-[#7B2CBF]/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B2CBF] transition-all appearance-none">
                <option>Dúvida sobre Plugin</option>
                <option>Suporte Técnico</option>
                <option>Orçamento Personalizado</option>
                <option>Outros Assuntos</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-widest ml-1">Sua Mensagem</label>
              <textarea 
                required
                rows={5}
                placeholder="Como podemos te ajudar hoje?"
                className="w-full bg-[#1A1A22] border border-[#7B2CBF]/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7B2CBF] transition-all resize-none"
              ></textarea>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-[#7B2CBF] hover:bg-[#9D4EDD] disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#7B2CBF]/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  Enviar Mensagem <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
