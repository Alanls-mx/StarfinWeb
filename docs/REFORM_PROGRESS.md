# Reformulação StarfinWeb — acompanhamento

## Versões privadas e notificações pessoais — 15/10/2026

- O painel de plugins permite enviar JAR de até 50 MB como rascunho, publicar, retirar e excluir rascunhos. O PostgreSQL guarda versão, compatibilidade, tamanho, SHA-256 e histórico; os arquivos ficam em `STARFIN_PRIVATE_RELEASES_DIR` fora de `public` e `dist`.
- A conta lista apenas versões publicadas dos produtos com licença ativa. Cada download exige sessão e verifica a licença novamente; não há URL pública permanente. Nenhum JAR real foi fornecido, então nenhum lançamento foi criado.
- A caixa pessoal agora persiste mensagens por destinatário, permite marcar como lidas e separa esses dados das notificações globais do painel. O administrador pode enviar uma mensagem ao ID de um cliente e a ação fica na auditoria.
- Um teste HTTP novo cobre ausência de sessão, ausência/revogação de licença, rascunho, publicação, bytes do download e isolamento das notificações.
- SMTP e Mercado Pago continuam aguardando configuração manual do proprietário. Pagamentos e e-mails reais seguem sem homologação.
- O CMS do painel também passou a editar os textos principais do hero e da seção da conta na homepage. O conteúdo é validado, persistido nas configurações e publicado pela API; imagem e links permanecem no layout. O teste HTTP cobre gravação, leitura pública e rejeição de texto vazio.

## Atualização visual de 15/10/2026

A identidade gamer em preto, verde e ciano foi aplicada à home, ao catálogo, à página de produto, ao acesso, à conta, às licenças e aos pedidos. A skin fornecida pelo proprietário entrou como personagem nas ilustrações e a textura original foi guardada em `public/voxel/`. Tokens, componentes e regras de uso estão em `docs/DESIGN_SYSTEM.md`. As demais páginas públicas e administrativas receberam a paleta revisada; seus fluxos profundos continuam sujeitos à revisão descrita nas próximas fases. Esta atualização foi preparada na `main` sem nova implantação na VPS.

## Operação administrativa e publicação autorizada em 15/10/2026

- Changelog administrativo agora grava criação, alteração e remoção no PostgreSQL.
- Auditoria administrativa persistida e consultável registra responsável, operação, recurso, data e justificativa das concessões manuais sem expor a chave completa.
- Concessão manual recebe origem própria (`admin_grant`) e justificativa; sua revogação não alcança compras pagas. Registros anteriores sem origem explícita são tratados conservadoramente como pagamentos e não podem ser revogados por esta ação.
- O endpoint administrativo de licenças mascara as chaves. A exclusão definitiva de usuários foi bloqueada para preservar histórico de pedidos; suspensão e reativação permanecem na edição da conta.
- Newsletter retorna contagem real de entregas e falhas do SMTP em vez de anunciar sucesso antes do envio. Rotas administrativas que retornavam sucesso sem executar ação foram removidas.
- A verificação de integração deve ocorrer em base PostgreSQL isolada antes do deploy. SMTP e Mercado Pago continuam dependentes da configuração manual do proprietário; não declarar compra ou e-mail real homologado sem credenciais e ensaio apropriado.

Atualizado em 15/10/2026. A implementação descrita abaixo foi publicada na `main` e implantada na VPS no commit `0ffda33`.

## Mapa auditado

| Área | Implementação atual | Estado observado |
| --- | --- | --- |
| Loja pública | React 18, Vite, React Router, `src/app/pages` e `src/app/components` | Home e catálogo já têm uma primeira direção visual; páginas institucionais ainda variam muito e contêm dados demonstrativos. |
| Conta | `Dashboard.tsx` concentra perfil, plugins, licenças, servidores, pagamentos e notificações em um arquivo extenso | Ações e dados precisam ser separados por módulo; alguns retornos ainda são demonstrativos. |
| Administração | `AdminLayout`, `AdminSidebar`, 19 páginas em `src/app/pages/admin` | Existe navegação e CRUD parcial; faltam telas próprias para licenças, instalações, auditoria e lançamentos. |
| API publicada | `server/src/index.ts` (Express) e `server/src/data.ts` | O frontend Vite usa rotas relativas `/api`; este é o backend comercial efetivo. |
| Backend alternativo | `app/api`, Prisma e Next.js | Contém um fluxo separado; o checkout Next permanece desabilitado. Não tratar como segundo checkout de produção. |
| Banco | PostgreSQL na VPS publicada e no backend Express da `main` | O adaptador e a CI usam PostgreSQL. A inicialização da versão publicada criou a tabela aditiva `status_components`. |
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

Verificações: build Vite, typecheck estrito do frontend e do servidor, testes unitários, persistência PostgreSQL e teste HTTP do contrato StarfinCore. Os testes de banco foram executados em uma cópia isolada da base publicada; não substituem a homologação de um pagamento real.

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
- A página de novidades usa publicações reais do changelog; artigos e autores demonstrativos e newsletter sem ação foram removidos. O status não começa mais como "operacional" com horário inventado: componentes iniciam como não verificados e as alterações administrativas são persistidas na nova tabela `status_components`.
- A API não aceita mais marcar 2FA como ativo por uma simples preferência, pois ainda não há fluxo de autenticação em duas etapas. A interface indica a indisponibilidade.

Revisão visual feita na homepage publicada em desktop e celular, além de carrinho vazio e recuperação de senha em ambiente local. A revisão visual completa de páginas com dados, tablet, admin e conta permanece pendente.

As fases implementadas estão registradas na `main` (`git log --oneline`). O ensaio foi feito em uma cópia isolada do banco de produção antes da implantação.

## Próximas fases

1. Design System: expandir tokens e componentes compartilhados para as demais páginas antigas; revisar estados, responsividade e acessibilidade.
2. Loja: revisar home, catálogo, documentação e páginas institucionais completas com dados reais.
3. Conta: dividir o dashboard em módulos de plugins, licenças, servidores, pedidos e segurança.
4. Administração: continuar revisão de usuários, licenças, instalações, conteúdo e demais módulos. Versões e arquivos privados já têm fluxo administrativo.
5. Segurança: aprofundar permissões por operação e políticas de transferência. Auditoria persistida, downloads privados e caixa pessoal por destinatário já estão implementados; falta homologar JARs reais.
6. Homologação: executar CI PostgreSQL, testes de navegador, pagamentos em sandbox, contrato StarfinCore, responsividade e acessibilidade.

## Limites e rollback

- A VPS recebeu o build da `main` em 15/10/2026. A troca ficou restrita a `starfinweb.service`, `/opt/starfinweb/app/dist` e `/opt/starfinweb/app/server/dist`; Nginx, PostgreSQL compartilhado e serviços vizinhos não foram reiniciados.
- O adaptador PostgreSQL foi testado com um clone do banco publicado. Antes da troca foi gerado um backup `pg_dump --format=custom` e outro dos arquivos antigos. As tabelas novas são aditivas. Para reversão, usar os diretórios antigos preservados em `/opt/starfinweb/rollback-*` e reiniciar somente `starfinweb.service`; não restaurar o banco de produção às cegas.
- O checkout Express usa o adaptador síncrono Python/psycopg2 para PostgreSQL. O custo de abrir uma conexão por consulta precisa ser medido antes de homologar desempenho.
- A `main` foi enviada ao GitHub por solicitação do proprietário. O workflow do repositório executa a suíte com PostgreSQL após o push.
- SMTP e Mercado Pago de produção dependem da configuração manual informada pelo proprietário. Sem credenciais e sandbox de pagamento, não declarar os fluxos financeiros homologados.
- Nenhum produto ou JAR real foi inventado. Downloads privados devem permanecer indisponíveis até a implementação autorizada.
