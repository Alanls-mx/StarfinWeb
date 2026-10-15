# Protocolo StarfinCore / StarfinWeb (pré-homologação)

## Endpoint existente estendido
POST /v1/license/check (backend Express da StarfinWeb).

Solicitação: licenseKey, hwid (UUID da instalação), serverName, serverPort, platform, pluginName="StarfinCore", coreVersion.
A API exige IP de origem consistente com sua configuração de proxy.

Resposta positiva: valid=true, protocolVersion=2, allowedProductIds=[ids canônicos],
authorizationExpiresAt (ISO-8601, concessão temporária), allowedPlugins (legado) e updates (legado).

StarfinBans utiliza id canônico starfin_bans; nomes de exibição e bootstrap nunca se convertem automaticamente em autorização.

O StarfinCore deve confiar somente em allowedProductIds, validar o schema e respeitar o limite de authorizationExpiresAt. Ausência de v2 não deve ser interpretada como autorização.

## Status de integração
Este contrato foi implementado em uma branch e não equivale a uma ativação comprovada em produção. Testar em banco sintético com compra aprovada e cancelada, conta banida, IP/proxy, concorrência e instalação divergente.

## Segurança
- Não transmitir a chave para console/chat ou logs.
- Apenas HTTPS em ambiente real.
- Respostas inválidas e falta de autorização não autorizam produtos.
- Não criar automaticamente permissões via retorno de checkout.
- Se a origem da conexão for proxy reverso, configurar TRUSTED_PROXY_IPS e TRUSTED_PROXY_HEADER, sem confiar em cabeçalhos arbitrários.

## Condições financeiras de homologação
O endpoint `/api/webhooks/mercadopago` exige `MP_WEBHOOK_SECRET` no backend e uma assinatura HMAC-SHA256 válida com `x-signature`, `x-request-id` e parâmetro de query `data.id`. Confira a documentação oficial do Mercado Pago. Sem esta variável, o webhook responde HTTP 503 e não entrega produtos.

A confirmação sempre requer consulta GET ao Mercado Pago utilizando credenciais do estabelecimento e conferência do pedido, valor em centavos, moeda BRL e ID do pagamento.
Notificações repetidas são tratadas com IDs determinísticos de compra e reconciliação. Planos/assinaturas estão bloqueados neste estágio. Cupons que zeram a cobrança não liberam licença.

Executar, em sandbox + banco descartável: pagamento aprovado, pendente, recusado, estornado, chargeback, notificação repetida, assinatura inválida, total divergente, dois pagamentos com mesmo pedido, crash e retomada do webhook.

**Não considerar homologação financeira real concluída sem essas evidências.** Nada foi executado em credenciais reais ou na base de produção.
