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
