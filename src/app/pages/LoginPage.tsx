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
  const requestedNext = searchParams.get('next') || '/account';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/account';
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
    <div className="min-h-screen bg-[#0b1715] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="rounded-[1.7rem] border border-[#426a51] bg-[#172c22] p-7 sm:p-10">
          <p className="sf-eyebrow mb-3">Bem-vindo de volta</p><h1 className="text-4xl font-extrabold tracking-tight mb-3">Entrar</h1>
          <p className="text-[#bed7c6] mb-8">Acesse sua conta para gerenciar licenças, plugins e servidores.</p>

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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-[#0B1715]/60 border border-[#177F58]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#177F58] focus:ring-2 focus:ring-[#177F58]/20 transition-all duration-300"
                />
              </div>
            </div>

            {error ? <div className="text-sm text-red-400">{error}</div> : null}

            <Link to="/forgot-password" className="block text-right text-sm text-[#a9f58e] hover:text-white">Esqueceu a senha?</Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="sf-button-primary w-full disabled:opacity-60"
            >
              <User className="w-5 h-5" />
              Entrar
            </motion.button>
          </form>
        </div>

        <div className="flex min-h-[470px] flex-col justify-between border-l-2 border-[#85ed65] bg-[#14251e] p-7 text-white sm:p-10">
          <div className="max-w-sm"><h2 className="text-3xl font-extrabold tracking-tight">Sua conta StarfinPlugins.</h2><p className="mt-4 text-sm leading-7 text-[#bdd2c5]">Consulte licenças, servidores e pedidos em um só lugar.</p></div>
          <Link to="/register" className="sf-button-primary self-start">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
