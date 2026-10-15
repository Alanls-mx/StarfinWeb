# StarfinWeb — StarfinPlugins

> A versão da branch `main` foi implantada na VPS em 15/10/2026. Consulte [o registro da publicação](docs/DEPLOYMENT_2026-10-15.md) e [as pendências da reformulação](docs/REFORM_PROGRESS.md).

Bem-vindo ao **StarfinPlugins**, uma plataforma completa e moderna desenvolvida para a venda, gerenciamento e licenciamento de plugins para servidores de Minecraft. Este projeto oferece uma experiência premium tanto para o cliente final quanto para o administrador da loja.

## 🚀 Tecnologias Utilizadas

O projeto utiliza as tecnologias mais modernas do ecossistema JavaScript para garantir performance, segurança e uma interface fluida.

### Frontend
- **React 18**: Biblioteca principal para a interface.
- **Vite**: Build tool extremamente rápida para o desenvolvimento.
- **Tailwind CSS v4**: Estilização moderna e responsiva.
- **Framer Motion**: Animações suaves e interações avançadas.
- **Lucide React**: Biblioteca de ícones consistente.
- **Sonner**: Sistema de notificações (toasts) elegante.
- **React Router v7**: Gerenciamento de rotas e navegação.
- **Recharts**: Visualização de dados e estatísticas no painel admin.

### Backend
- **Node.js & Express**: Servidor robusto para a API.
- **PostgreSQL**: Persistência do backend Express, por meio do adaptador síncrono em `server/src/postgres-sync.ts` (requer Python 3 e `psycopg2`).
- **Prisma ORM**: Presente apenas no backend Next.js legado; não governa a API Express publicada.
- **Mercado Pago SDK v2**: Integração de checkout e conciliação; requer credenciais e homologação de produção.
- **Sessões persistidas**: Autenticação do backend Express.
- **Nodemailer**: Sistema de envio de e-mails (verificação, recuperação de senha, newsletters).

---

## ✨ Funcionalidades Principais

### Para Clientes
- **Loja de Plugins**: Catálogo completo com filtros por categoria, busca e ordenação.
- **Sistema de Carrinho**: Adição de múltiplos plugins ou planos de assinatura.
- **Checkout**: Disponível quando as credenciais e o webhook do Mercado Pago estiverem configurados e homologados.
- **Dashboard do Usuário**:
  - Gerenciamento de licenças adquiridas.
  - Configuração de servidores e IPs autorizados.
  - Geração de Chaves de API.
  - Histórico de pedidos; a caixa pessoal de notificações ainda está em desenvolvimento.
  - Alteração de perfil e senha.

### Para Administradores
- **Painel Admin**: Gestão de catálogo, clientes, pedidos e conteúdo em evolução.
- **Gestão de Produtos**: CRUD completo de plugins, categorias e planos.
- **Controle de Usuários**: Listagem, edição de permissões e banimentos.
- **Suporte via Tickets**: Sistema interno para atendimento ao cliente.
- **Marketing**: Gestão de cupons de desconto e envio de newsletters.
- **Configurações do Site**: Alteração de logo, nome, redes sociais e chaves de API diretamente pelo painel.

---

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
- **Node.js** (versão 22 usada na VPS)
- **npm** ou **pnpm**
- **PostgreSQL** e **Python 3 com psycopg2** para o backend Express

### 1. Instalação
Clone o repositório e instale as dependências:
```bash
git clone https://github.com/Alanls-mx/StarfinWeb.git
cd StarfinWeb
npm install
```

### 2. Configuração de Ambiente
Crie um arquivo `.env` na raiz do projeto seguindo o modelo abaixo (ajuste conforme necessário):
```env
# Backend
PORT=3001
HOST=127.0.0.1
DATABASE_URL=postgresql://usuario:senha@localhost:5432/starfin_dev
API_URL=http://localhost:3001

# Mercado Pago (configurar depois da homologação)
MP_ACCESS_TOKEN=seu_access_token_aqui
MP_WEBHOOK_SECRET=seu_segredo_do_webhook

# SMTP (Opcional para e-mails)
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=usuario@exemplo.com
SMTP_PASS=sua_senha
```

### 3. Banco de Dados
O backend Express usa PostgreSQL e cria as tabelas necessárias ao iniciar. O comando `prisma:migrate` pertence apenas ao backend Next.js legado e não deve ser aplicado à base Express.

### 4. Execução
Para rodar o projeto em ambiente de desenvolvimento (Frontend + Backend):

**Terminal 1 (Backend):**
```bash
npm run server:dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

O site estará disponível em `http://localhost:5173` e a API em `http://localhost:3001`.

---

## 📁 Estrutura de Pastas

- `/src/app`: Todo o código fonte do frontend (Componentes, Páginas, Hooks).
- `/server/src`: Código fonte do backend Express e lógica de dados.
- `/prisma`: Esquema do banco de dados e arquivos de migração.
- `/public`: Ativos estáticos como imagens e logos.

## Desenvolvimento local

1. Configure uma instância PostgreSQL descartável e defina `DATABASE_URL=postgresql://usuario:senha@localhost:5432/starfin_dev`.
2. Instale Python 3 e `psycopg2-binary` no mesmo ambiente que executa a API.
3. Execute `npm ci`, `npm run server:dev` e `npm run dev` em terminais separados.
4. Verifique com `npm run build`, `npm run web:typecheck` e `npm run server:typecheck`.

O backend comercial utilizado pelo Vite é o Express em `server/src`. O diretório `app/api` pertence ao fluxo Next.js legado e não deve ser tratado como um segundo checkout de produção. Publicações futuras exigem backup, ensaio em uma cópia da base e troca controlada do serviço StarfinWeb.

---

## 📄 Licença

Este projeto foi desenvolvido para a **StarfinPlugins**. Todos os direitos reservados.

---
*Desenvolvido com ❤️ pela equipe StarfinPlugins.*
