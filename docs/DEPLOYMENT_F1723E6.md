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
