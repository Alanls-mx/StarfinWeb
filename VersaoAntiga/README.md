# Starfin WebSite

Projeto fullstack com Vite + React (SPA) e servidor Express integrado em desenvolvimento. O servidor é montado como middleware do Vite em `dev` e possui build separado para produção.

## Requisitos
- Node.js ≥ 18 (recomendado: Node 22, conforme `vite.config.server.ts` alvo `node22`)
- pnpm ≥ 10 (ou npm)
- Variáveis de ambiente em `.env`

## Scripts
- `pnpm dev` / `npm run dev`: inicia o Vite em modo desenvolvimento com Express embutido (porta `8080`)
- `pnpm build` / `npm run build`: build do client e do server
- `pnpm build:client` / `npm run build:client`: build do SPA
- `pnpm build:server` / `npm run build:server`: build do servidor para `dist/server`
- `pnpm start` / `npm run start`: inicia o servidor compilado (`node dist/server/node-build.mjs`)
- `pnpm test` / `npm run test`: testes com Vitest
- `pnpm typecheck` / `npm run typecheck`: verificação de tipos com TypeScript
- `pnpm format.fix` / `npm run format.fix`: formatação com Prettier

## Ambiente (.env)
Defina os valores conforme necessidade. Chaves privadas/públicas podem ser fornecidas como PEM inline ou via caminho de arquivo.

- `PING_MESSAGE` — mensagem de resposta de `GET /api/ping` (`server/index.ts:33`)
- `PORT` — porta do servidor em produção (`server/node-build.ts:6`)
- `STARFIN_LOGS` — habilita logs em memória (`server/index.ts:16`)
- `STARFIN_HASH_STRICT` — validação estrita do hash do JAR (`server/index.ts:281`)
- `PRIVATE_KEY_PEM` — PEM da chave privada para assinar respostas de licença (`server/index.ts:405-410`)
- `PRIVATE_KEY_PASSPHRASE` — passphrase opcional da chave privada (`server/index.ts:408,427`)
- `PRIVATE_KEY_PATH` — caminho para arquivo PEM da chave privada (`server/index.ts:416-429`)
- `PUBLIC_KEY_PEM` — PEM da chave pública servida em `GET /api/license/public-key` (`server/index.ts:435-438`)
- `PUBLIC_KEY_PATH` — caminho para arquivo PEM da chave pública (`server/index.ts:439-451`)
- `STARFIN_OFFICIAL_HASH` — hash oficial permitido do JAR (`server/index.ts:455`)
- `MERCADO_PAGO_ACCESS_TOKEN` — token do Mercado Pago (`server/store.ts:716-719`)
- `MP_ACCESS_TOKEN` — alias alternativo para o token (`server/store.ts:716-719`)
- `APP_BASE_URL` — base pública para callbacks/páginas (`server/store.ts:722-724`)
- `PUBLIC_BASE_URL` — alias alternativo da base pública (`server/store.ts:722-724`)
- `JWT_SECRET` — segredo para assinar tokens JWT (`server/middleware/auth.ts:5`, `server/routes/auth.ts:6`)
- `JWT_EXPIRES_IN` — expiração dos JWTs (ex.: `7d`) (`server/routes/auth.ts:7`)
- `VITE_PUBLIC_BUILDER_KEY` — chave pública do Builder.io usada no client (se aplicável)

Exemplo mínimo de `.env`:
```
PING_MESSAGE=pong
PORT=3000
STARFIN_LOGS=true
STARFIN_HASH_STRICT=true
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=7d
APP_BASE_URL=https://seu-dominio.com
MERCADO_PAGO_ACCESS_TOKEN=
```

## Desenvolvimento
- `pnpm dev` executa o SPA em `http://localhost:8080` e injeta o Express como middleware
- Configuração do Vite em `vite.config.ts` integra o servidor via `createServer` (`vite.config.ts:44-48`)

## Build e Produção
- Build do server gera `dist/server/node-build.mjs` com alvo `node22` (`vite.config.server.ts:14-15`)
- Inicie com `pnpm start` ou `npm run start`
- `PORT` controla a porta de produção (`server/node-build.ts:6`)

## Licenciamento e Assinatura
- Respostas de licença são assinadas com RSA (`server/index.ts:256-267`)
- Forneça a chave privada via `PRIVATE_KEY_PEM` ou `PRIVATE_KEY_PATH` (+ `PRIVATE_KEY_PASSPHRASE` se necessário)
- Chave pública é exposta em `GET /api/license/public-key` para verificação (`server/index.ts:240-246`)

## Pagamentos (Mercado Pago)
- Configure `MERCADO_PAGO_ACCESS_TOKEN` (ou `MP_ACCESS_TOKEN`) e `APP_BASE_URL`/`PUBLIC_BASE_URL`
- Endpoints: iniciar checkout (`server/index.ts:169`), webhook (`server/index.ts:170-171`)
- Visualização de configuração via `GET /api/settings/payments` (`server/index.ts:158-167`)

## Rotas Principais
- Autenticação: `POST /api/auth/login`, `register`, `logout`, `forgot-password`, `reset-password` (`server/index.ts:133-137`)
- Plugins: CRUD e releases (`server/index.ts:139-149`)
- Pedidos: CRUD e operações (`server/index.ts:150-157`)
- Licenças: listar, validar, revogar, renovar, atribuir, IPs (`server/index.ts:173-238`)
- Usuários: perfil atual, CRUD admin, compras (`server/index.ts:384-391`)
- Assets e destaques de site: upload/listagem (`server/index.ts:41-131`)

## Instalação
```
pnpm install
# ou
npm install
```

## Execução
```
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

