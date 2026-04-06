import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ApiError, verifyEmail } from '../lib/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) setStatus('ok');
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setError(e instanceof ApiError ? e.message : 'Falha ao verificar email.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-10 text-center">
          {status === 'loading' ? (
            <div className="text-gray-400">Verificando...</div>
          ) : status === 'ok' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl mb-3">Email confirmado</h1>
              <p className="text-gray-400 mb-8">Sua conta foi ativada. Você já pode comprar e integrar plugins.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-3xl mb-3">Falha na verificação</h1>
              <p className="text-gray-400 mb-8">{error}</p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/account"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
              >
                Ir para Minha Conta
              </Link>
            </motion.div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-[#7B2CBF] text-white rounded-xl hover:bg-[#7B2CBF]/10 hover:border-[#C77DFF] transition-all duration-300"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

