# StarfinPlugins - Plataforma de E-commerce para Plugins Minecraft

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
- **SQLite (better-sqlite3)**: Banco de dados local rápido e confiável.
- **Prisma ORM**: Gerenciamento de esquemas e migrações de banco de dados.
- **Mercado Pago SDK v2**: Integração completa para pagamentos via PIX, Cartão e Boleto.
- **JWT (JSON Web Token)**: Autenticação segura de usuários.
- **Nodemailer**: Sistema de envio de e-mails (verificação, recuperação de senha, newsletters).

---

## ✨ Funcionalidades Principais

### Para Clientes
- **Loja de Plugins**: Catálogo completo com filtros por categoria, busca e ordenação.
- **Sistema de Carrinho**: Adição de múltiplos plugins ou planos de assinatura.
- **Checkout Seguro**: Integração transparente com Mercado Pago.
- **Dashboard do Usuário**:
  - Gerenciamento de licenças adquiridas.
  - Configuração de servidores e IPs autorizados.
  - Geração de Chaves de API.
  - Histórico de pagamentos e notificações.
  - Alteração de perfil e senha.

### Para Administradores
- **Painel Admin Completo**: Visão geral de vendas, faturamento e novos clientes.
- **Gestão de Produtos**: CRUD completo de plugins, categorias e planos.
- **Controle de Usuários**: Listagem, edição de permissões e banimentos.
- **Suporte via Tickets**: Sistema interno para atendimento ao cliente.
- **Marketing**: Gestão de cupons de desconto e envio de newsletters.
- **Configurações do Site**: Alteração de logo, nome, redes sociais e chaves de API diretamente pelo painel.

---

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **pnpm**

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
JWT_SECRET=sua_chave_secreta_aqui
API_URL=http://localhost:3001

# Mercado Pago
MP_ACCESS_TOKEN=seu_access_token_aqui

# SMTP (Opcional para e-mails)
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=usuario@exemplo.com
SMTP_PASS=sua_senha
```

### 3. Banco de Dados
O projeto utiliza SQLite. Para inicializar o banco e as tabelas:
```bash
npm run prisma:migrate
```

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

## 🚂 Deploy no Railway

Este projeto está configurado para deploy automático no **Railway**.

### Configuração
1. Conecte seu repositório GitHub ao Railway.
2. Adicione as variáveis de ambiente (`Variables`) necessárias:
   - `JWT_SECRET`: Uma string aleatória segura.
   - `MP_ACCESS_TOKEN`: Seu token de produção do Mercado Pago.
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: (Opcional) Caminho para o banco SQLite se desejar persistência em volume montado.
3. O Railway utilizará o comando `railway:build` definido no `package.json` para compilar o frontend e o backend, e o comando `start` para iniciar o servidor único que serve ambos.

---

## 📄 Licença

Este projeto foi desenvolvido para a **StarfinPlugins**. Todos os direitos reservados.

---
*Desenvolvido com ❤️ pela equipe StarfinPlugins.*
