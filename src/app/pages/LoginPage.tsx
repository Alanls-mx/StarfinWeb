import { Lock, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/account';
  const { login, state } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (state.status === 'authenticated') {
      navigate(next, { replace: true });
    }
  }, [state.status, navigate, next]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-10">
          <h1 className="text-4xl mb-3">Entrar</h1>
          <p className="text-gray-400 mb-8">Acesse sua conta para gerenciar licenças e integrações.</p>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              setError(null);
              try {
                await login(email.trim(), password);
                toast.success('Login realizado com sucesso!');
                navigate(next, { replace: true });
              } catch (e) {
                if (e instanceof ApiError) {
                  setError(e.message);
                  toast.error(e.message);
                } else {
                  setError('Não foi possível entrar.');
                  toast.error('Não foi possível entrar.');
                }
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
                />
              </div>
            </div>

            {error ? <div className="text-sm text-red-400">{error}</div> : null}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-xl hover:shadow-[#7B2CBF]/50 transition-all duration-300 disabled:opacity-60"
            >
              <User className="w-5 h-5" />
              Entrar
            </motion.button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#7B2CBF]/15 to-[#3C096C]/10 backdrop-blur-sm border border-[#7B2CBF]/25 rounded-2xl p-10">
            <div className="text-2xl text-white mb-2">O que você desbloqueia</div>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>Gerenciamento de licenças e downloads</li>
              <li>Criação e revogação de chaves de API</li>
              <li>Integração de plugin → servidor (validação via API)</li>
              <li>Suporte prioritário para planos Premium</li>
            </ul>
          </div>

          <Link
            to="/docs#api"
            className="block text-center px-6 py-4 bg-transparent border-2 border-[#7B2CBF] text-white rounded-2xl hover:bg-[#7B2CBF]/10 hover:border-[#C77DFF] transition-all duration-300"
          >
            Ver documentação da API
          </Link>

          <Link
            to="/register"
            className="block text-center px-6 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-2xl hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
