# Publicação StarfinWeb — 15/10/2026

## Versão publicada

- Commit da `main`: `f1723e6`.
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

## Limites atuais

SMTP e Mercado Pago continuam aguardando configuração manual do proprietário. Não houve pagamento real nem envio de e-mail de produção neste ensaio. Downloads privados, gestão de versões, caixa pessoal de notificações e outros módulos previstos no escopo original ainda não estão completos; consultar `REFORM_PROGRESS.md`.
