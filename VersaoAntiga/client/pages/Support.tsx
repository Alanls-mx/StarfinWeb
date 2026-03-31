import { useState } from "react";
import Layout from "@/components/Layout";
import { Send } from "lucide-react";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement actual contact form submission
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Suporte ao Cliente</h1>
            <p className="text-xl text-muted-foreground">
              Estamos aqui para ajudar. Entre em contato com nosso time de
              suporte.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">
                Envie-nos uma Mensagem
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    E-mail
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
                  <label className="block text-sm font-medium mb-2">
                    Assunto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Como podemos ajudar?"
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Conte-nos mais detalhes..."
                    rows={6}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {isLoading ? "Enviando..." : "Enviar Mensagem"}
                </button>
              </form>
            </div>

            {/* FAQ & Info */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold mb-2">Como baixo um plugin?</h3>
                  <p className="text-sm text-muted-foreground">
                    Após comprar, você pode baixar o plugin imediatamente do seu
                    painel de conta.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold mb-2">Vocês oferecem reembolsos?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sim, oferecemos garantia de devolução do dinheiro em 30 dias
                    se não estiver satisfeito.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold mb-2">
                    Como posso vender meu plugin?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato com nosso time para se tornar um parceiro
                    desenvolvedor. Analisamos cuidadosamente.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold mb-2">Há suporte ao cliente?</h3>
                  <p className="text-sm text-muted-foreground">
                    Absolutamente! Nosso time está disponível 24/7 para ajudar
                    com qualquer dúvida.
                  </p>
                </div>
              </div>

              <div className="mt-8 bg-accent/10 border border-accent/50 rounded-lg p-6">
                <h3 className="font-bold text-accent mb-2">
                  Tempos de Resposta
                </h3>
                <p className="text-sm text-muted-foreground">
                  Normalmente respondemos todas as consultas em 24 horas durante
                  o horário comercial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
