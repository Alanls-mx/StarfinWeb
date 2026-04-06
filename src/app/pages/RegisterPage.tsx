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
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-10">
          <h1 className="text-4xl mb-3">Criar Conta</h1>
          <p className="text-gray-400 mb-8">Crie sua conta e confirme o email para ativar compras e integrações.</p>

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
                  className="w-full pl-12 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
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
                  className="w-full pl-12 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mínimo 6 caracteres"
                  className="w-full pl-12 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
                />
              </div>
            </div>

            {error ? <div className="text-sm text-red-400">{error}</div> : null}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || !name.trim() || !email.trim() || password.length < 6}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-xl hover:shadow-[#7B2CBF]/50 transition-all duration-300 disabled:opacity-60"
            >
              Criar Conta
            </motion.button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#7B2CBF]/15 to-[#3C096C]/10 backdrop-blur-sm border border-[#7B2CBF]/25 rounded-2xl p-10">
            <div className="text-2xl text-white mb-2">Depois de cadastrar</div>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>Você recebe um email de confirmação</li>
              <li>Após confirmar, compras e integrações são liberadas</li>
              <li>Você recebe emails de compra, suporte e notificações</li>
            </ul>
          </div>
          <Link
            to="/login"
            className="block text-center px-6 py-4 bg-transparent border-2 border-[#7B2CBF] text-white rounded-2xl hover:bg-[#7B2CBF]/10 hover:border-[#C77DFF] transition-all duration-300"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  );
}

