import { Lock, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, registerAccount } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0b1715] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="rounded-[1.7rem] border border-[#426a51] bg-[#172c22] p-7 sm:p-10">
          <p className="sf-eyebrow mb-3">Entre para o ecossistema</p><h1 className="text-4xl font-extrabold tracking-tight mb-3">Criar conta</h1>
          <p className="text-[#bed7c6] mb-8">Crie sua conta para acompanhar licenças, servidores e pedidos.</p>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              setError(null);
              try {
                const res = await registerAccount({ name: name.trim(), email: email.trim(), password });
                localStorage.setItem('starfinplugins_token', res.token);
                await refresh();
                toast.success('Conta criada com sucesso! Bem-vindo.');
                navigate('/account', { replace: true });
              } catch (e) {
                if (e instanceof ApiError) {
                  setError(e.message);
                  toast.error(e.message);
                } else {
                  setError('Não foi possível criar a conta.');
                  toast.error('Não foi possível criar a conta.');
                }
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-gray-400">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-12 pr-4 py-3 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#177F58] focus:ring-2 focus:ring-[#177F58]/20 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-gray-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#177F58] focus:ring-2 focus:ring-[#177F58]/20 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-gray-400">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mínimo 8 caracteres"
                  className="w-full pl-12 pr-4 py-3 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#177F58] focus:ring-2 focus:ring-[#177F58]/20 transition-all duration-300"
                />
              </div>
              <p className="text-xs text-[#b6d3bd]">Use pelo menos 8 caracteres.</p>
            </div>

            {error ? <div className="text-sm text-red-400">{error}</div> : null}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || !name.trim() || !email.trim() || password.length < 8}
              className="sf-button-primary w-full disabled:opacity-60"
            >
              Criar Conta
            </motion.button>
          </form>
        </div>

        <div className="relative flex min-h-[470px] flex-col justify-between overflow-hidden rounded-[1.7rem] bg-[linear-gradient(145deg,#d3f8b9,#76ddcf)] p-7 text-[#173526] sm:p-10">
          <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-70" />
          <div className="relative z-10 max-w-xs"><p className="sf-eyebrow !text-[#126e51]">Pronto para começar?</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight">Seu servidor ganha um espaço próprio.</h2><p className="mt-3 text-sm leading-7 text-[#3a6952]">Depois do cadastro, suas compras e licenças poderão ser consultadas pela plataforma. A confirmação por e-mail depende do serviço de envio configurado.</p></div>
          <img src="/voxel/creator-avatar.webp" alt="Personagem voxel inspirado em uma skin de jogador" className="absolute right-0 bottom-0 h-[53%] w-[55%] object-contain object-bottom" />
          <Link to="/login" className="sf-button-primary relative z-10 mt-auto self-start">Já tenho conta</Link>
        </div>
      </div>
    </div>
  );
}

