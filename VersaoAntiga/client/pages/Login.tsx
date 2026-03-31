import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await auth.login(email, password);
      if (!result.success) {
        setError(result.message || "Falha no login");
      } else {
        if (result.user?.role === "admin") navigate("/admin");
        else navigate("/area-do-cliente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚙️</span>
              </div>
              <h1 className="text-2xl font-bold">Bem-vindo de Volta</h1>
              <p className="text-muted-foreground mt-2">
                Faça login na sua conta StarfinPlugins
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 font-semibold"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {error && (
              <div className="mt-3 text-sm text-destructive">{error}</div>
            )}

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Não tem uma conta?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              to="/register"
              className="w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-card-foreground/5 transition text-center block font-semibold"
            >
              Criar Conta
            </Link>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <a
                href="#"
                className="block text-sm text-primary hover:text-primary/80 transition"
              >
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          {/* Demo Info */}
          <div className="mt-8 bg-card border border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
            Credenciais de demonstração:
            <br />
            Email: demo@example.com
            <br />
            Senha: demo123
          </div>
        </div>
      </div>
    </Layout>
  );
}
