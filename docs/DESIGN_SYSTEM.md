# Identidade visual StarfinWeb

Atualizado em 15/10/2026. Esta etapa da reformulação está no código da `main`; a implantação da VPS deve ser tratada separadamente.

## Direção

Visual original inspirado em jogos de blocos, com superfícies escuras para navegação e áreas claras para leitura, busca e ações de conta. Os personagens são ilustrações próprias, sem usar arte oficial de Minecraft.

## Tokens e componentes

Os tokens globais e as classes reutilizáveis ficam em `src/styles/theme.css`:

| Uso | Token | Valor |
| --- | --- | --- |
| Base escura | `--background` | `#0b1010` |
| Destaque e ação primária | `--primary` | `#85ed65` |
| Detalhes e foco | `--accent` | `#62e5de` |
| Superfície clara | `--sf-cream` | `#f4f8ef` |

`sf-button-primary`, `sf-button-secondary`, `sf-eyebrow`, `sf-grid` e `sf-soft-panel` cobrem os elementos recorrentes da loja. A tipografia usa Manrope para títulos e DM Sans para texto. Links e botões precisam de texto que descreva a ação; estados de foco visíveis usam o ciano. Animações respeitam `prefers-reduced-motion`.

## Ilustrações

Arquivos em `public/voxel/`:

- `creator-avatar.webp`: personagem gerado a partir da skin enviada pelo proprietário, usado na home, no acesso e em estados vazios.
- `creator-skin-source.png`: textura original 64×64 enviada pelo proprietário, preservada como imagem de referência.
- `engineer.webp`: personagem da seção de conta e licenciamento.
- `guardian.webp`: personagem da seção StarfinBans e de estados vazios de produto/licença.

Os arquivos WebP têm transparência e tamanhos próximos de 150–190 KB. Em contextos informativos, usar texto alternativo descritivo; quando a imagem apenas decora um conteúdo já descrito, usar `alt=""`.

## Aplicação

Home, catálogo, produto, login, cadastro, Minha Conta, licenças e pedidos têm novas composições. Navegação, rodapé e páginas institucionais e administrativas recebem a paleta compartilhada. Estados vazios devem explicar o que aparecerá ali e oferecer um próximo passo funcional. Recursos ainda não disponíveis devem ser identificados claramente, sem resultados ou depoimentos fictícios.
