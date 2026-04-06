import { motion } from 'motion/react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Política de Privacidade</h1>
          <p className="text-gray-400 text-lg">
            Esta política descreve como coletamos, usamos e protegemos seus dados na StarfinPlugins.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-8 space-y-8"
        >
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">1. Dados que coletamos</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos coletar informações como nome, email, dados de perfil (como avatar e links sociais), dados de licença,
              informações técnicas necessárias para validação (por exemplo, IP/HWID quando aplicável) e registros de suporte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">2. Como usamos seus dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Usamos seus dados para autenticação, entrega de licenças, funcionamento do StarfinLicense, suporte via tickets,
              envio de comunicações essenciais (ex.: verificação de email) e, quando autorizado, envio de promoções e novidades.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">3. Emails de marketing e Newsletter</h2>
            <p className="text-gray-300 leading-relaxed">
              Ao se inscrever em nossa newsletter, você concorda em receber comunicações sobre novos plugins, atualizações,
              promoções e notícias da StarfinPlugins. Utilizamos seu email exclusivamente para este fim. Você pode cancelar
              sua inscrição a qualquer momento clicando no link de "descadastro" presente em nossos emails ou entrando
              em contato com nosso suporte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">4. Compartilhamento</h2>
            <p className="text-gray-300 leading-relaxed">
              Não vendemos seus dados. Podemos compartilhar informações com provedores essenciais (ex.: serviço de email)
              exclusivamente para operar o produto e cumprir obrigações legais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">5. Retenção e Segurança</h2>
            <p className="text-gray-300 leading-relaxed">
              Armazenamos os dados pelo tempo necessário para operar o serviço e cumprir requisitos legais. Aplicamos medidas
              de segurança técnicas e organizacionais para reduzir riscos de acesso não autorizado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">6. Seus direitos</h2>
            <p className="text-gray-300 leading-relaxed">
              Você pode solicitar acesso, correção, atualização e exclusão de dados, conforme aplicável. Solicitações podem ser
              feitas via suporte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">7. Atualizações desta política</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos atualizar esta política periodicamente. As alterações entram em vigor após publicação nesta página.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

