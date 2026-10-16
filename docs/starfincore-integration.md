# StarfinCore: instalações e licenças

O contrato autoritativo é o PostgreSQL da StarfinWeb. Uma compra aprovada ou uma concessão administrativa auditada gera uma vaga para o produto. Pedidos pendentes, cancelados, estornados e compras revogadas não geram vagas. Uma instalação consome uma vaga somente após o proprietário atribuir o produto a ela. O banco serializa atribuições simultâneas por conta e produto.

## Ativação

1. Na Minha Conta, crie uma instalação.
2. No Minecraft, execute `/starfincore ativar` como operador. O Core guarda a identidade e a credencial nos arquivos internos e envia a credencial por HTTPS; a StarfinWeb armazena somente seu hash. A API responde com um código temporário de uso único, válido por dez minutos.
3. O proprietário autenticado informa o código na instalação cadastrada em `/account/servers`.
4. O Core passa a usar `Authorization: Installation <credential>` e seu UUID persistente. A credencial não é a chave da conta, nem a chave de compra.

`POST /v3/installations/challenge` recebe `installationId`, `credential`, `name`, `platform`, `coreVersion`. `POST /api/users/me/servers/:id/claim` recebe `code` usando a sessão do proprietário. Códigos expirados ou utilizados não são aceitos. A credencial pode ser revogada pelo proprietário ou por administrador; a recuperação requer novo código.

## Verificação

`POST /v3/installations/check` recebe `installationId`, `platform`, `coreVersion` e o cabeçalho de autenticação da instalação. A resposta tem `protocolVersion: 3`, prazo de 45 minutos, hora de validação, diagnóstico de conta/instalação/rede, limites e versões publicadas. Somente `allowedProductIds` autoriza execução. `products` é também informativo: `acquired`, `assigned`, `authorized`, `quantity` e `releases` não substituem `allowedProductIds`.

O IP observado vem do socket ou de um proxy explicitamente confiável. O site mostra IP autorizado e observado; o proprietário pode corrigir o endereço sem excluir a instalação. Quando um estorno reduz o número de vagas abaixo das atribuições existentes, a ordem estável de cadastro determina quais instalações retêm autorização até a redistribuição das vagas.

## Arquivos oficiais

`GET /v3/installations/releases/:id/download` exige a credencial da instalação e `X-Installation-Id`. A API reavalia compra, atribuição, vaga, IP, publicação e SHA-256 antes de entregar o mesmo arquivo privado oferecido pelo site. O Core verifica o SHA-256 antes de salvar em `plugins/StarfinCore/downloads/`. O comando `/starfincore baixar <productId>` baixa a versão publicada mais recente; não a instala automaticamente.

## Migração legada

As rotas antigas `/v1/license/check` e `/api/plugin-auth/verify` respondem `410` e não concedem produtos. Chaves globais, chaves de servidor e chaves de compra existentes permanecem apenas como histórico. Novas contas, compras e instalações não recebem essas chaves. Na confirmação do novo vínculo, compras legadas com HWID exatamente igual ao UUID do Core são atribuídas à instalação quando houver vaga. Vínculos divergentes podem ser recuperados por código autenticado e atribuição autorizada pelo proprietário, sem apagar os registros históricos.

O painel administrativo mostra instalações por cliente, consumo, IPs e histórico. Transferência administrativa exige motivo, revoga a credencial e remove atribuições do proprietário anterior. Concessões comerciais continuam separadas do pedido e auditadas; a transferência nunca concede produtos ao novo proprietário.
