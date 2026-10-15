# Estabilização de segurança e licenciamento — StarfinPlugins

## Alterações aplicadas na main
- A geração de licenças por usuário autenticado no backend Next foi desativada.
- O antigo endpoint Express `POST /api/purchases` não cria nem aprova compras.
- Atualização de config por cliente não pode mais modificar status/chave de licença.
- Administração de servidores é encaminhada apenas para handlers que verificam ownership.
- Licenciamento por servidor cruza associações com compras efetivamente aprovadas.
- Compras demonstrativas não participam da lista de licenças reais.
- Credenciais completas de licença não vão para webhooks do Discord.
- Aprovação comercial segue fluxo Mercado Pago que verifica autenticidade, ID, referência, moeda e valor.

## Limites de homologação
Testes CI comprovam build e cenários sintéticos, não um pagamento real.
Após ativar a nova API na VPS configurar MP_WEBHOOK_SECRET usando o segredo da aplicação Mercado Pago e verificar URL de webhook e proxy. Se não configurada, a API rejeita o webhook com 503. Não habilitar venda até este pré-requisito.
A publicação da nova versão requer também validar que a URL /v1/license/check realmente chega no backend Express publicado e que StarfinCore autentica com uma licença de teste válida.
