# StarfinWeb — revisão visual e de licenciamento (2026-10)

## Escopo aplicado nesta branch
- Homepage com identidade editorial para produtos de software, sem números inventados.
- Navegação, catálogo, rodapé e shell do administrador simplificados.
- Filtros de preço/avaliação que não funcionavam foram removidos do catálogo.
- StarfinBans e StarfinCore mostrados na homepage como projetos em desenvolvimento, **não** como produtos lançados.
- O log da API não expõe chaves. Webhooks do fluxo Prisma também deixam de enviar chaves, HWIDs e e-mail.
- O endpoint Next usa a impressão SHA-256 da chave para rate limiting, sem confiar em X-Forwarded-For não autenticado.
- O Express usa IP da conexão por padrão, exigindo proxy explicitamente confiável para ler cabeçalhos.
- Validação de titularidade/entitlement antes do vínculo de identificadores na API Prisma; vínculo concorrente usa compare-and-set.
- O catálogo demonstrativo do backend Express deixa de ser semeado por padrão. Ativar localmente com STARFIN_ENABLE_DEMO_CATALOG=true apenas fora de produção.

## Integração StarfinBans
Repositório existente: https://github.com/Alanls-mx/StarfinBans

O StarfinBans tem módulos Spigot 1.8.8 e BungeeCord; seu arquivo plugin.yml depende de StarfinLicense. **Não** renomear a dependência para StarfinCore até termos builds reais para estas plataformas. O StarfinCore Paper Java 21 inicial não roda em BungeeCord nem em Spigot 1.8.8. O endpoint Express aceita aliases StarfinCore e StarfinLicense para transição, mas isso não substitui um plugin executável compatível com a plataforma.

Antes do lançamento:
1. Escolher o escopo suportado (Paper atual, Spigot legado e/ou BungeeCord).
2. Alinhar protocolos de licença e nomes dos produtos entre Core, StarfinBans e loja.
3. Rodar testes de autorização positiva e negativa, falha de conexão e transferência.
4. Publicar arquivos JAR por produto apenas após validar mecanismos de download/controle de acesso.
5. Revisar restrições comerciais e de licenciamento previstas nas regras oficiais do Minecraft.

## Configuração de proxy do backend Express
Por segurança, cabeçalhos como X-Forwarded-For e CF-Connecting-IP não são confiáveis por padrão.
Para proxy reverso próprio, configurar duas variáveis:
- TRUSTED_PROXY_IPS: IP(s) exatos da conexão de proxy na rede privada, separados por vírgula.
- TRUSTED_PROXY_HEADER: cf-connecting-ip, x-real-ip ou x-forwarded-for.

O proxy deve remover cabeçalhos fornecidos diretamente pelo cliente e impedir acesso direto à aplicação fora do proxy. Sem isto, **não habilite** a confiança em cabeçalhos. Testar o IP identificado antes de entrar em produção, pois licenças antigas podem estar vinculadas ao IP público e a mudança afetaria a validação.

## Limitações conhecidas — não homologadas
- O repositório tem dois caminhos de backend: Next/Prisma/SQLite e Express/MySQL (bridge Python). Confirmar qual atende o domínio de produção antes de publicar.
- Não rodamos migrações, testes financeiros, smoke tests em produção ou deploy.
- Base existente pode conter plugins demonstrativos pré-cadastrados (nomes, preços, imagens e avaliações). A alteração acima evita novos seeds automáticos, mas não altera dados já persistidos: requer auditoria manual.
- O caminho de download e o fluxo de checkout precisam de testes ponta a ponta antes do lançamento.
- Sem execução contra banco real, não afirmar que toda a segurança/comportamento está homologada.
- O design de páginas secundárias/admin operacionais ainda precisará de uma segunda passada, além da nova base visual.
