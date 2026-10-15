# Publicação StarfinWeb — 15/10/2026

## Versão e ambiente

- Commit implantado: `0ffda33` da branch `main`.
- Aplicação: `/opt/starfinweb/app`, serviço `starfinweb.service`, porta local `127.0.0.1:3801`.
- Banco: PostgreSQL 18, base `starfin_site`. O segredo de conexão permanece em `/opt/starfinweb/app.env` e não foi copiado para o repositório.
- Domínios: `starfinplugins.com.br`, `www.starfinplugins.com.br` e `api.starfinplugins.com.br`. O certificado existente atende aos três nomes e vence em 13/01/2027; não houve alteração no Nginx.

## Ensaio e verificação

- Gerado backup da base antes do ensaio e restaurado no banco isolado `starfin_stage_release`.
- Executados os testes unitários de validação de pagamento e conversão SQL, os testes de persistência PostgreSQL e o teste HTTP do contrato StarfinCore v2. Todos passaram.
- O [workflow de CI do commit implantado](https://github.com/Alanls-mx/StarfinWeb/actions/runs/38820481924) também terminou com sucesso.
- A versão candidata respondeu em `127.0.0.1:3811`: página inicial e catálogo `200`, rotas protegidas `401`/`403` sem sessão e licença inválida `400`.
- Antes da troca final, gerados `/opt/starfinweb/backups/starfin-site-pre-deploy-20261015T225703Z.dump` e `/opt/starfinweb/backups/starfin-code-pre-deploy-20261015T225703Z.tar.gz`.
- Após a troca, a página inicial e a API pública responderam `200` com validação TLS; `www` redireciona. `starfinweb.service`, Nginx e PostgreSQL permaneceram ativos, assim como as portas dos outros serviços.

## Reversão

Os diretórios de código anteriores foram preservados em `/opt/starfinweb/rollback-dist-0ffda33` e `/opt/starfinweb/rollback-server-dist-0ffda33`. Uma reversão deve parar somente `starfinweb.service`, mover os diretórios atuais para quarentena, recolocar os diretórios anteriores e iniciar somente esse serviço. Conservar os backups de banco; não restaurar sobre produção sem analisar as alterações efetuadas após a implantação.

## Pendências conhecidas

- O catálogo de produção está vazio. Nenhum preço, produto ou artefato foi inventado; o cadastro real cabe ao administrador.
- SMTP e credenciais de produção do Mercado Pago serão configurados manualmente pelo proprietário. Sem elas, a entrega de e-mail e o checkout financeiro não estão homologados.
- Downloads privados, auditoria administrativa completa, caixa pessoal de notificações e partes do painel e CMS ainda requerem implementação. Consulte `REFORM_PROGRESS.md` para o escopo restante.
- Não foi feito pagamento real nem validação com um servidor Minecraft em produção. O teste StarfinCore usa licença e instalação sintéticas na base isolada.
