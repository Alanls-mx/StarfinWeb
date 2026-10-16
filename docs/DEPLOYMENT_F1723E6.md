# Publicação StarfinWeb — 15/10/2026

## Versão publicada

- Commit da primeira publicação desta etapa: `f1723e6`.
- Revisão final atualmente publicada: `1227b4a` (chave global mascarada nas respostas administrativas e justificativa visível na auditoria).
- Aplicação: `/opt/starfinweb/app`, serviço `starfinweb.service`, porta `127.0.0.1:3801`.
- Domínios verificados: `https://starfinplugins.com.br` e `https://api.starfinplugins.com.br`.
- A alteração de banco é aditiva: tabela `admin_audit` e coluna `purchases.grantSource`, com padrão conservador `payment` para registros anteriores. O PostgreSQL compartilhado e o Nginx não foram reiniciados.

## Verificações

- Build Vite, typecheck estrito do frontend e build do servidor passaram localmente.
- [CI do commit implantado](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38831298611) terminou com sucesso.
- Testes de conversão PostgreSQL, validação financeira, persistência de pagamentos e contrato StarfinCore v2 passaram no banco isolado `starfin_stage_20261015_candidate` na VPS.
- A candidata respondeu em `127.0.0.1:3811`: `/`, `/api/health`, `/api/plugins` e `/api/changelog` retornaram 200; auditoria sem credencial retornou 403; licença inválida retornou 400.
- Após a publicação, site e API responderam 200 com TLS válido. A imagem `/voxel/creator-avatar.webp` respondeu 200 e o HTML apontou para o bundle desta versão. `starfinweb.service`, Nginx e PostgreSQL permaneceram ativos. O certificado apresentado expira em 13/01/2027.
- A primeira troca foi revertida automaticamente porque a checagem ocorreu antes de o Node abrir a porta. Após confirmar o serviço anterior saudável, a janela de verificação foi ampliada e a segunda troca passou.

## Backup e reversão

- Banco: `/opt/starfinweb/backups/starfin-site-pre-f1723e6-20261016T004554Z.dump`.
- Código: `/opt/starfinweb/backups/starfin-code-pre-f1723e6-20261016T004554Z.tar.gz`.
- Diretórios anteriores: `/opt/starfinweb/app/rollback-dist-pre-f1723e6-20261016T004635Z` e `/opt/starfinweb/app/rollback-server-dist-pre-f1723e6-20261016T004635Z`.

Se for necessário reverter, parar somente `starfinweb.service`, mover os diretórios atuais `dist` e `server/dist` para quarentena, restaurar os dois diretórios anteriores e iniciar somente `starfinweb.service`. O banco ganhou apenas estruturas aditivas; não restaurar o dump sobre dados de produção criados após o deploy sem análise.

### Revisão `1227b4a`

Os quatro grupos de testes de integração foram repetidos em `starfin_stage_1227b4a` e passaram. Antes da troca final foram gerados `/opt/starfinweb/backups/starfin-site-pre-1227b4a-20261016T004900Z.dump` e `/opt/starfinweb/backups/starfin-code-pre-1227b4a-20261016T004900Z.tar.gz`. O rollback imediato desta revisão está em `/opt/starfinweb/app/rollback-dist-pre-1227b4a-20261016T004905Z` e `/opt/starfinweb/app/rollback-server-dist-pre-1227b4a-20261016T004905Z`. Após a troca, o site e a API responderam 200 com TLS válido; a auditoria sem autenticação respondeu 403 e a verificação de licença inválida respondeu 400. StarfinWeb, Nginx e PostgreSQL permaneceram ativos.

A [CI do commit `1227b4a`](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38831570215) terminou com sucesso.

## Limites atuais

Na revisão `1227b4a`, SMTP e Mercado Pago aguardavam configuração manual e ainda não existiam downloads privados nem caixa pessoal de notificações. A revisão seguinte está descrita abaixo; consultar também `REFORM_PROGRESS.md`.

## Publicação `66e078e` — versões privadas e notificações pessoais

- [CI da revisão](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38833631821): sucesso. Dez testes passaram na base isolada `starfin_stage_releases_20261015`, inclusive acesso a JAR por licença ativa, revogação e isolamento de notificações. A candidata respondeu 200 em home, health, catálogo e changelog; endpoints privados sem credencial retornaram 401/403.
- Antes da troca, backup PostgreSQL em `/opt/starfinweb/backups/starfin-site-pre-66e078e-20261016T011249Z.dump` e código em `/opt/starfinweb/backups/starfin-code-pre-66e078e-20261016T011249Z.tar.gz`.
- Reversão imediata: `/opt/starfinweb/app/rollback-dist-pre-66e078e-20261016T011249Z` e `/opt/starfinweb/app/server/rollback-dist-pre-66e078e-20261016T011249Z`. A troca afetou apenas `starfinweb.service` e seus builds. PostgreSQL e Nginx permaneceram ativos.
- Os arquivos privados ficam por padrão em `/opt/starfinweb/app/private/releases`, com diretórios 0700, fora do diretório web. Eles devem entrar nos backups futuros. O banco contém as tabelas aditivas `plugin_releases` e `user_notifications`.
- Após o deploy, site, API, health, catálogo e changelog responderam 200 via HTTPS; as rotas privadas rejeitaram chamadas sem credencial, a skin respondeu 200 e o certificado vence em 13/01/2027. Nenhum JAR de produto foi publicado.
- SMTP e Mercado Pago aguardam configuração manual do proprietário. Pagamento real, e-mail real e compatibilidade de JARs com cada plataforma Minecraft não foram homologados.

## Publicação `f3c3b45` — CMS da homepage

- [CI da revisão](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38834141905): sucesso. O teste de integração cobriu persistência dos textos, leitura pública e rejeição de conteúdo vazio. A candidata respondeu 200 em home, health e configurações públicas na base isolada.
- Backups antes da troca: `/opt/starfinweb/backups/starfin-site-pre-f3c3b45-20261016T011813Z.dump` e `/opt/starfinweb/backups/starfin-code-pre-f3c3b45-20261016T011813Z.tar.gz`.
- Rollback de build: `/opt/starfinweb/app/rollback-dist-pre-f3c3b45-20261016T011813Z` e `/opt/starfinweb/app/server/rollback-dist-pre-f3c3b45-20261016T011813Z`. A troca reiniciou somente `starfinweb.service`.
- Após a publicação, home, health, catálogo, API de configurações e skin responderam 200 via HTTPS. A API pública contém `homeContent`; uma rota privada sem sessão respondeu 401. StarfinWeb, Nginx e PostgreSQL permaneceram ativos.

## Publicação `c88671b` — interface estável no frontend

- [CI da revisão](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38835410309): sucesso, incluindo builds, typechecks e testes de integração PostgreSQL.
- Título, descrição, favicon, marca do cabeçalho/rodapé e textos da Home agora são definidos no frontend. A leitura tardia de `/api/public/settings` foi removida desses pontos. Os campos visuais correspondentes foram retirados do painel administrativo; os dados antigos permanecem no banco por compatibilidade.
- Backup PostgreSQL: `/opt/starfinweb/backups/starfin-site-pre-c88671b-20261016T013151Z.dump`. Backup de código: `/opt/starfinweb/backups/starfin-code-pre-c88671b-20261016T013151Z.tar.gz`.
- Rollback imediato: `/opt/starfinweb/app/rollback-dist-pre-c88671b-20261016T013151Z` e `/opt/starfinweb/app/server/rollback-dist-pre-c88671b-20261016T013151Z`.
- Após a troca, `starfinweb.service`, Nginx e PostgreSQL estavam ativos. Site, catálogo, documentação, favicon e health da API responderam 200 por HTTPS. O HTML apontou para `index-BtDio_yS.js` e trouxe o título estático.

## Publicação `f004b8a` — acabamento das páginas secundárias

- [CI da revisão](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38835741625): sucesso. A skin aparece somente na Home; login, cadastro e produto usam a superfície escura e o suporte usa a ação “Novo chamado”.
- Backup PostgreSQL: `/opt/starfinweb/backups/starfin-site-pre-f004b8a-20261016T013534Z.dump`. Backup de código: `/opt/starfinweb/backups/starfin-code-pre-f004b8a-20261016T013534Z.tar.gz`.
- Rollback imediato: `/opt/starfinweb/app/rollback-dist-pre-f004b8a-20261016T013534Z` e `/opt/starfinweb/app/server/rollback-dist-pre-f004b8a-20261016T013534Z`.
- Site, login, catálogo, favicon e health da API responderam por HTTPS. O HTML apontou para `index-CHTVScur.js`. StarfinWeb, Nginx e PostgreSQL permaneceram ativos.

## Publicação `35f0064` — restauração visual da sessão

- [CI da revisão](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38836150514): sucesso. O header usa um estado neutro enquanto valida um token salvo, sem mostrar “Entrar” a quem já tem sessão. Sem token, o estado inicial é anônimo.
- Backup PostgreSQL: `/opt/starfinweb/backups/starfin-site-pre-35f0064-20261016T014024Z.dump`. Backup de código: `/opt/starfinweb/backups/starfin-code-pre-35f0064-20261016T014024Z.tar.gz`.
- Rollback imediato: `/opt/starfinweb/app/rollback-dist-pre-35f0064-20261016T014024Z` e `/opt/starfinweb/app/server/rollback-dist-pre-35f0064-20261016T014024Z`.
- Após o deploy, o site serviu `index-D4bFgh9f.js`, o health da API respondeu 200 e StarfinWeb, Nginx e PostgreSQL estavam ativos.
