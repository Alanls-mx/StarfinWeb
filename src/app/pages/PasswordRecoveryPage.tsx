import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ApiError, forgotPassword, resetPassword } from '../lib/api';

export function PasswordRecoveryPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (token && password !== confirmation) {
      setError('As senhas não conferem.');
      return;
    }
    setBusy(true);
    try {
      if (token) await resetPassword({ token, password });
      else await forgotPassword(email.trim());
      setDone(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Não foi possível concluir a solicitação. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-5xl items-center px-5 py-32 sm:px-8">
      <div className="grid w-full gap-10 border-t border-white/15 pt-12 md:grid-cols-[.8fr_1fr] md:gap-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Sua conta</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{token ? 'Criar nova senha' : 'Recuperar acesso'}</h1>
          <p className="mt-5 leading-7 text-muted-foreground">{token ? 'Escolha uma senha para voltar a acessar sua conta.' : 'Informe o e-mail cadastrado. Se existir uma conta, enviaremos um link de recuperação.'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-card p-7 sm:p-9">
          {done ? (
            <div role="status" className="space-y-5">
              <h2 className="text-xl font-semibold">{token ? 'Senha atualizada' : 'Solicitação recebida'}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{token ? 'Você já pode entrar com sua nova senha.' : 'Se o endereço estiver cadastrado, enviaremos as instruções de recuperação.'}</p>
              <Link to="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Voltar para o login</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {token ? (
                <>
                  <label className="block text-sm text-muted-foreground" htmlFor="new-password">Nova senha</label>
                  <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-input bg-input-background px-4 py-3 text-white" />
                  <label className="block text-sm text-muted-foreground" htmlFor="confirm-password">Confirmar senha</label>
                  <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded-lg border border-input bg-input-background px-4 py-3 text-white" />
                </>
              ) : (
                <>
                  <label className="block text-sm text-muted-foreground" htmlFor="recovery-email">E-mail</label>
                  <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-lg border border-input bg-input-background px-4 py-3 text-white" />
                </>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <button disabled={busy} type="submit" className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Aguarde...' : token ? 'Salvar nova senha' : 'Enviar link'}</button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-white">Voltar para o login</Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
