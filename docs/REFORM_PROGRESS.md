# Reformulação StarfinWeb — acompanhamento

Atualizado em 15/10/2026. Base: `main` do GitHub no commit `5ce97c4`.

## Mapa auditado

| Área | Implementação atual | Estado observado |
| --- | --- | --- |
| Loja pública | React 18, Vite, React Router, `src/app/pages` e `src/app/components` | Home e catálogo já têm uma primeira direção visual; páginas institucionais ainda variam muito e contêm dados demonstrativos. |
| Conta | `Dashboard.tsx` concentra perfil, plugins, licenças, servidores, pagamentos e notificações em um arquivo extenso | Ações e dados precisam ser separados por módulo; alguns retornos ainda são demonstrativos. |
| Administração | `AdminLayout`, `AdminSidebar`, 19 páginas em `src/app/pages/admin` | Existe navegação e CRUD parcial; faltam telas próprias para licenças, instalações, auditoria e lançamentos. |
| API publicada | `server/src/index.ts` (Express) e `server/src/data.ts` | O frontend Vite usa rotas relativas `/api`; este é o backend comercial efetivo. |
| Backend alternativo | `app/api`, Prisma e Next.js | Contém um fluxo separado; o checkout Next permanece desabilitado. Não tratar como segundo checkout de produção. |
| Banco | PostgreSQL na VPS publicada; `main` ainda continha adaptador MySQL | Esta fase alinha o adaptador de desenvolvimento e a CI com PostgreSQL. Nenhuma migração foi executada na produção. |
| Licenciamento | `POST /v1/license/check` no Express | Deve preservar `protocolVersion: 2`, `allowedProductIds` canônicos e prazo de autorização curto. StarfinBans exige `starfin_bans`. |
| Pagamento | Checkout Express + webhook Mercado Pago | Concessão só após confirmação no provedor. Assinaturas permanecem bloqueadas até homologação. |

## Fase 1 — auditoria e arquitetura

Implementado nesta fase:

- Alinhamento do código Express com PostgreSQL, preservando o contrato atual de licenças e os controles de conciliação financeira recentes da `main`.
- CI preparada com PostgreSQL descartável.
- Remoção da senha administrativa padrão e proteção do token Mercado Pago nas respostas administrativas.
- Recuperação de senha com token persistido, de uso único e validade de uma hora.
- Remoção de duas rotas duplicadas que mascaravam respostas reais de pagamentos e configuração de plugins.
- Histórico de pagamentos passa a vir de pedidos reais; links fictícios de JAR deixam de ser anunciados.
- Conteúdo fictício inicial de equipe, vagas e estatísticas foi removido dos defaults.

Verificações locais: build Vite, typecheck estrito do frontend, typecheck do servidor, testes unitários do adaptador SQL e testes de validação Mercado Pago. A integração de persistência PostgreSQL e o teste HTTP do contrato StarfinCore foram adicionados à CI, mas ainda precisam executar contra um PostgreSQL descartável antes de considerar esta fase fechada.

## Fases 2 a 5 — implementação parcial

- A navegação administrativa foi agrupada por domínio e usa os tokens visuais compartilhados. A página pública de produto e o carrinho foram reconstruídos com dados do backend, estados vazios e sem promessas de preço promocional ou download inexistente.
- O cadastro e a edição básica de plugins no painel agora enviam os campos aceitos pelo Express. A URL de JAR deixou de ser exposta nas respostas públicas. O painel ainda precisa de gestão de versões e arquivos privados.
- O fluxo de recuperação de senha ganhou página para solicitar o link e consumir o token. Uma troca de senha revoga sessões antigas. O disparo real do e-mail ainda depende do SMTP que o proprietário configurará manualmente.
- O editor de compras não aceita mais aprovar pagamentos ou editar chaves. Apenas IP autorizado e reset de HWID podem ser alterados nessa rota, com notificação administrativa. A concessão manual de plugins em usuários ainda existe e precisa receber indicação explícita de origem e trilha de auditoria persistida.
- Cupons fixos foram removidos. O checkout recusa um cupom que deixou de ser válido após a consulta e mostra que planos ainda não estão homologados.
- Upload administrativo aceita somente JPEG, PNG, WebP e GIF com assinatura de arquivo válida; SVG foi bloqueado.
- Sessões de usuários excluídos deixam de autenticar. Cadastro e recuperação exigem senha de pelo menos oito caracteres. A edição administrativa de produtos rejeita métricas de avaliação e download inventadas, valida preço e ID canônico e impede IDs de licença duplicados.
- A troca de senha da conta exige a senha atual quando já existe uma. Respostas de perfil e usuários não devolvem o hash de senha. Notificações administrativas globais deixaram de aparecer na caixa pessoal; o comando antigo de “marcar todas” retorna indisponível até existir uma caixa por usuário e não apaga dados globais.
- A conta ganhou uma página própria de pedidos. O retorno do Mercado Pago consulta o status do pedido na API antes de mostrar qualquer confirmação; o parâmetro da URL sozinho não anuncia pagamento aprovado. Estados pendente, pago, recusado, cancelado, reembolsado e estornado têm rótulos distintos.
- A conta ganhou também uma página própria de licenças, com chave principal mascarada por padrão, cópia, regeneração e edição do IP global. O dashboard agora navega para licença, servidores, plugins, pedidos e perfil e trata erro e ausência de plugins. Foram removidos o suposto histórico de downloads com tamanho inventado, links sem destino, promessa de atendimento 24/7 e o botão de assinatura que não podia concluir checkout.
- O modal do plugin deixou de chamar a edição do IP global como se alterasse o IP daquela compra. A API valida IPv4/IPv6 na edição do IP global e rotas duplicadas de configurações, perfil e regeneração foram removidas.
- O painel administrativo separa pedidos financeiros de licenças e instalações. Pedidos têm consulta somente de leitura com cliente, itens, valor e estado vindo do banco; a tela de instalações mascara a chave na lista, trata erros e estados vazios, e a API valida o IP antes da edição administrativa. A consulta do cliente agora busca seus pedidos por `userId` diretamente no banco.
- A página de contato deixou de confirmar falsamente o envio de um formulário sem backend e passou a encaminhar para chamados persistidos e documentação. FAQ e página de planos não prometem downloads nem assinatura antes da homologação. Benefícios de emprego não cadastrados foram retirados da página de carreiras.
- A API não aceita mais marcar 2FA como ativo por uma simples preferência, pois ainda não há fluxo de autenticação em duas etapas. A interface indica a indisponibilidade.

Revisão visual local feita em viewport estreito: home, carrinho vazio e recuperação de senha. O backend local não subiu sem PostgreSQL; a revisão visual de páginas com dados, desktop, tablet, admin e conta permanece pendente.

Commits locais na `main`: `bda16cc` (PostgreSQL, licenças e segurança da API), `3404049` (loja, conta inicial e navegação administrativa), `a5fd68d` (validação de catálogo), `fa71c8b` (segurança da conta). Todos ainda sem push para evitar publicação automática não verificada.

## Próximas fases

1. Design System: expandir tokens e componentes compartilhados para as demais páginas antigas; revisar estados, responsividade e acessibilidade.
2. Loja: revisar home, catálogo, documentação e páginas institucionais completas com dados reais.
3. Conta: dividir o dashboard em módulos de plugins, licenças, servidores, pedidos e segurança.
4. Administração: completar usuários, licenças, instalações, versões, pedidos, conteúdo e demais módulos com operações reais.
5. Segurança: trilha de auditoria persistida, permissões por operação, downloads privados e políticas de transferência.
   A caixa pessoal de notificações precisa de modelo próprio por destinatário antes de ser ativada.
6. Homologação: executar CI PostgreSQL, testes de navegador, pagamentos em sandbox, contrato StarfinCore, responsividade e acessibilidade.

## Limites e rollback

- A VPS de produção não foi tocada nesta reformulação. Publicação e migrações exigem autorização posterior.
- O adaptador PostgreSQL pode requerer ajuste para bases antigas com divergências de esquema. Antes de publicar: backup, comparação de esquema, ensaio com cópia descartável e plano de reversão de serviço.
- A nova tabela `password_reset_tokens` é criada no início da API. A publicação futura deve comparar o esquema esperado com uma cópia do banco real, exportar backup com `pg_dump --format=custom`, ensaiar a inicialização na cópia e validar login, licença e pedidos. Reversão: voltar ao binário anterior e à configuração de conexão anterior; restaurar o backup em banco separado se houver alteração incompatível, sem sobrescrever produção às cegas.
- O checkout Express usa o adaptador síncrono Python/psycopg2 para PostgreSQL. O custo de abrir uma conexão por consulta precisa ser medido antes de homologar desempenho.
- `main` pode estar conectada a um deploy externo por push; os commits desta sessão ficam locais até ser comprovado que a publicação automática está desativada. Nenhum push foi realizado.
- SMTP e Mercado Pago de produção dependem da configuração manual informada pelo proprietário. Sem credenciais e sandbox de pagamento, não declarar os fluxos financeiros homologados.
- Nenhum produto ou JAR real foi inventado. Downloads privados devem permanecer indisponíveis até a implementação autorizada.
