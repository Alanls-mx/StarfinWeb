import Layout from "@/components/Layout";

export default function About() {
  return (
    <Layout>
      <div className="min-h-screen py-16 md:py-20 px-3 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">Sobre o StarfinPlugins</h1>
            <p className="text-xl text-muted-foreground">
              O principal marketplace para plugins de servidores Minecraft
            </p>
          </div>

          <div className="space-y-12 text-foreground">
            <section>
              <h2 className="text-3xl font-bold mb-4">Nossa Missão</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                O StarfinPlugins foi fundado para criar um marketplace unificado onde
                administradores de servidores possam descobrir, comprar e
                gerenciar plugins premium do Minecraft. Nos comprometemos a
                apoiar desenvolvedores de plugins e ajudar servidores a
                prosperar com as melhores ferramentas disponíveis.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Por Que Nos Escolher</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-3xl mb-3">🔒</div>
                  <h3 className="text-xl font-bold mb-2">Plataforma Segura</h3>
                  <p className="text-muted-foreground">
                    Segurança em nível de indústria para proteger seus dados e
                    transações
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-3xl mb-3">💪</div>
                  <h3 className="text-xl font-bold mb-2">Qualidade Premium</h3>
                  <p className="text-muted-foreground">
                    Todos os plugins são verificados e testados para qualidade e
                    desempenho
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-3xl mb-3">🤝</div>
                  <h3 className="text-xl font-bold mb-2">Foco na Comunidade</h3>
                  <p className="text-muted-foreground">
                    Apoiando desenvolvedores e comunidades de servidores em todo
                    o mundo
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-xl font-bold mb-2">Suporte Rápido</h3>
                  <p className="text-muted-foreground">
                    Tempos de resposta rápidos e equipe de suporte dedicada
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4">Nosso Time</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                O StarfinPlugins é construído por um time apaixonado de entusiastas
                de Minecraft e desenvolvedores de software dedicados a melhorar
                o ecossistema de plugins.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
