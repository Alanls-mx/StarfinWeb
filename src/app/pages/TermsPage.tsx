import { motion } from 'motion/react';

export function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Termos de Uso</h1>
          <p className="text-gray-400 text-lg">
            Ao acessar e utilizar a StarfinPlugins, você concorda com os termos abaixo.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-8 space-y-8"
        >
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">1. Aceitação</h2>
            <p className="text-gray-300 leading-relaxed">
              Estes termos regem o uso do site, painel, APIs e conteúdos disponibilizados pela StarfinPlugins.
              Caso você não concorde, não utilize nossos serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">2. Conta e Segurança</h2>
            <p className="text-gray-300 leading-relaxed">
              Você é responsável por manter a confidencialidade das credenciais e por qualquer atividade realizada
              na sua conta. Podemos suspender ou encerrar contas em caso de uso indevido, fraude, tentativa de
              burlar licenciamento ou violação destes termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">3. Licenças e Uso de Plugins</h2>
            <p className="text-gray-300 leading-relaxed">
              Os plugins e recursos podem exigir validação por licença (StarfinLicense). É proibido redistribuir,
              revender, compartilhar chaves de licença, ou modificar mecanismos de validação. O acesso Premium
              concede acesso aos plugins conforme as regras e disponibilidade do plano.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">4. Compras, Pagamentos e Assinaturas</h2>
            <p className="text-gray-300 leading-relaxed">
              Compras e assinaturas podem estar sujeitas a validações antifraude. Em assinaturas, o acesso pode ser
              suspenso após expiração, cancelamento ou falha de pagamento. Sempre que possível, manteremos histórico
              de transações no painel do usuário.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">5. Suporte</h2>
            <p className="text-gray-300 leading-relaxed">
              O suporte é fornecido via tickets e canais oficiais. Podemos solicitar logs, informações do servidor e
              detalhes de ambiente para diagnosticar problemas. Chamados ofensivos, abusivos ou fraudulentos podem
              resultar em restrição de atendimento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">6. Conteúdo e Propriedade Intelectual</h2>
            <p className="text-gray-300 leading-relaxed">
              Marcas, textos, layout, software, plugins e documentação são protegidos por direitos autorais e outras
              leis aplicáveis. Você não deve copiar, reproduzir ou distribuir conteúdo sem autorização.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">7. Limitação de Responsabilidade</h2>
            <p className="text-gray-300 leading-relaxed">
              A StarfinPlugins não se responsabiliza por perdas indiretas, lucros cessantes ou danos decorrentes do uso
              do serviço, incluindo incompatibilidades de plugins, configurações incorretas, ou falhas de terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-white">8. Alterações</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos atualizar estes termos a qualquer momento. As mudanças entram em vigor após publicação nesta página.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

