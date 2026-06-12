# Truth or Dare Async Network - Backend

Backend da aplicação Truth or Dare, desenvolvido com Node.js, Express, Prisma e PostgreSQL. Responsável por gerenciar autenticação, usuários, pesquisa, notificações e clubes.

## 📌 Índice

- [Análise técnica do projeto](#análise-técnica-do-projeto)
  - [Stack principal](#stack-principal)
  - [Arquitetura (resumo)](#arquitetura-resumo)
  - [Dependências externas e conectividade](#dependências-externas-e-conectividade)
- [Requisitos técnicos](#requisitos-técnicos)
  - [Ambiente local](#ambiente-local)
  - [Ferramentas recomendadas](#ferramentas-recomendadas)
- [Como iniciar o projeto](#como-iniciar-o-projeto)
  - [1. Clonar o repositório](#1-clonar-o-repositório)
  - [2. Instalar dependências](#2-instalar-dependências)
  - [3. Configurar variáveis de ambiente](#3-configurar-variáveis-de-ambiente)
  - [4. Preparar o banco de dados](#4-preparar-o-banco-de-dados)
  - [5. Iniciar o servidor](#5-iniciar-o-servidor)
- [Script PowerShell - Rodar Backend Localmente (Windows)](#-script-powershell---rodar-backend-localmente-windows)
- [Script Completo - Primeira Execução (Manual)](#-script-completo---primeira-execução-manual)
- [Inicializações Subsequentes](#-inicializações-subsequentes)
- [Scripts disponíveis](#scripts-disponíveis)
  - [Desenvolvimento](#desenvolvimento)
  - [Banco de dados](#banco-de-dados)
  - [Testes](#testes)
  - [Limpeza](#limpeza)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Rotas principais](#rotas-principais)
  - [Autenticação](#-autenticação)
  - [Feed](#-feed)
  - [Desafios (Dares)](#-desafios-dares)
  - [Verdades (Truths)](#-verdades-truths)
  - [Usuários](#-usuários)
  - [Busca](#-busca)
  - [Clubes](#-clubes)
  - [Likes](#-likes)
  - [Uploads](#-uploads)
  - [Notificações](#-notificações)
  - [Suporte](#-suporte)
  - [Informações da App](#-informações-da-app)
- [Configuração para testes](#configuração-para-testes)
- [Notas de desenvolvimento](#notas-de-desenvolvimento)
  - [Organização por domínio](#organização-por-domínio)
  - [Features principais](#features-principais)
  - [TypeScript strict mode](#typescript-strict-mode)
  - [Migrations](#migrations)
  - [Rate limiting](#rate-limiting)
  - [Segurança](#segurança)
- [Exemplos de Uso](#exemplos-de-uso)
  - [Testar API localmente com curl](#testar-api-localmente-com-curl)
  - [Usando Postman/Insomnia](#usando-postmaninsomnia)
  - [Integração no Frontend](#integração-no-frontend)
- [Deployment](#deployment)
  - [Preparação para produção](#preparação-para-produção)
  - [Variáveis de ambiente de produção](#variáveis-de-ambiente-de-produção)
  - [Monitoramento](#monitoramento)
- [Testes de Performance](#testes-de-performance)
- [Contribuindo](#contribuindo)
  - [Workflow](#workflow)
  - [Padrões de código](#padrões-de-código)
  - [Before submitting PR](#before-submitting-pr)
- [Licença](#licença)

## Análise técnica do projeto

### Stack principal

- **Node.js 20+** com TypeScript em modo `strict`
- **Express.js** (v5.2.1) para roteamento e middleware
- **Prisma** (v7.6.0) como ORM com suporte a PostgreSQL
- **PostgreSQL** como banco de dados principal
- **Supabase** para recursos adicionais
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Jest + Supertest** para testes automatizados
- **Nodemailer** para envio de e-mails

### Arquitetura (resumo)

- `src/server.ts`: entrada principal da aplicação
- `src/app.ts`: configuração do Express e middlewares
- `src/controllers/`: controllers das rotas, organizados por domínio
- `src/services/`: lógica de negócio, organizados por domínio
- `src/routes/`: definição de rotas, organizados por domínio
- `src/middlewares/`: autenticação, validação e outros middlewares
- `src/dtos/`: objetos de transferência de dados (request/response)
- `src/utils/`: utilitários e helpers
- `src/lib/`: integrações e bibliotecas externas
- `prisma/schema.prisma`: esquema do banco de dados
- `tests/`: testes automatizados com Jest + Supertest
- `scripts/`: scripts utilitários (população de dados, limpeza, etc)
- `performance/`: testes de performance com Artillery

### Dependências externas e conectividade

- **PostgreSQL 13+** (local ou remoto)
- **Supabase** para funcionalidades adicionais
- **Nodemailer** para envio de e-mails transacionais
- Variáveis de ambiente para JWT, senhas e URLs
- Validação de entrada com DTOs
- Rate limiting em endpoints sensíveis

## Requisitos técnicos

### Ambiente local

- **Node.js LTS** (recomendado: 20+)
- **npm** (ou yarn/pnpm)
- **PostgreSQL 13+** (local ou remoto)
- **Git** para clonar o repositório

### Ferramentas recomendadas

- **Prisma Studio**: `npm run prisma:studio` para visualizar/editar dados
- **Postman** ou **Insomnia** para testar endpoints
- **VS Code** com extensões TypeScript

## Como iniciar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/pedrolabre/truth-or-dare-async-network.git
cd truth-or-dare-async-network/backend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

O projeto usa diferentes arquivos `.env` conforme o ambiente:

- **`.env.localdb`** - Para desenvolvimento local (use este!)
- **`.env.test`** - Para testes automatizados
- **`.env`** - Para produção/deploy

**Para desenvolvimento local:**

Edite o arquivo `.env.localdb` com suas configurações:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/truth_or_dare?sslmode=disable"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/truth_or_dare?sslmode=disable"
PORT=3333
JWT_SECRET="sua-chave-secreta-aqui"
JWT_REFRESH_SECRET="sua-chave-refresh-aqui"
NODE_ENV="development"
```

Ao iniciar o servidor, use:
```bash
NODE_ENV=localdb npm run dev
```

**Variáveis de ambiente importantes:**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `DIRECT_URL` | URL direta (usada por migrations) | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Porta do servidor | `3333` |
| `JWT_SECRET` | Chave secreta para JWT | `chave-super-secreta` |
| `JWT_REFRESH_SECRET` | Chave secreta para refresh tokens | `chave-refresh-secreta` |
| `NODE_ENV` | Ambiente | `development`, `test`, `production` | `.env.localdb`, `.env.test`, `.env` |
| `SUPABASE_URL` | URL do Supabase (opcional) | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase | `eyJxx...` |
| `RESEND_API_KEY` | Chave API para envio de e-mail | `re_xxx` |

### 4. Preparar o banco de dados

**Para desenvolvimento local (usando `.env.localdb`):**

No macOS/Linux (Bash):
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations no banco local
NODE_ENV=localdb npm run prisma:migrate
```

No Windows (PowerShell):
```powershell
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations no banco local
$env:NODE_ENV="localdb"; npm run prisma:migrate
```

### 5. Iniciar o servidor

No macOS/Linux (Bash):
```bash
NODE_ENV=localdb npm run dev
```

No Windows (PowerShell):
```powershell
$env:NODE_ENV="localdb"; npm run dev
# (ou utilize o script run-local.ps1 automatizado abaixo)
```

O servidor estará disponível em `http://localhost:3333`

## 🚀 Script PowerShell - Rodar Backend Localmente (Windows)

**Para Windows**, o arquivo `run-local.example.ps1` automatiza TUDO:

### Setup do script (primeira vez)

```powershell
# 0. Certifique-se de instalar as dependências
npm install

# 1. Copie o arquivo de exemplo
Copy-Item run-local.example.ps1 -Destination run-local.ps1

# 2. Edite run-local.ps1 com suas credenciais PostgreSQL
#    - Altere USER, PASSWORD, YOUR_DB_NAME
#    - Configure JWT_SECRET (algo seguro)
```

### Rodar o backend

```powershell
# Simplesmente execute o script
.\run-local.ps1
```

**O script faz automaticamente:**
- ✓ Define variáveis de ambiente (DATABASE_URL, PORT, JWT_SECRET)
- ✓ Executa migrations com `npx prisma migrate deploy`
- ✓ Inicia o servidor com `npm run dev`
- ✓ Se algo falhar, para a execução (segurança)

**Resultado esperado:**
```
✓ Variáveis de ambiente configuradas
✓ Migrations executadas
✓ Servidor rodando em http://localhost:3333
✓ Pronto para receber requisições!
```

## 🚀 Script Completo - Primeira Execução (Manual)

Se prefere não usar o PowerShell, use este script bash/cmd:

```bash
# 1. Instalar dependências
npm install

# 2. Gerar cliente Prisma
npm run prisma:generate

# 3. Executar migrations
npm run prisma:migrate

# 4. Iniciar servidor (com hot reload)
NODE_ENV=localdb npm run dev
```

## ⚡ Inicializações Subsequentes

Depois da primeira vez:

**Windows (PowerShell):**
```powershell
.\run-local.ps1  # Tudo automático
```

**macOS/Linux (Bash):**
```bash
NODE_ENV=localdb npm run dev
```

**Dicas:**
- O `NODE_ENV=localdb` garante que use o arquivo `.env.localdb`
- Lembre-se de definir `NODE_ENV=localdb` (ou `$env:NODE_ENV="localdb";` no PowerShell) para qualquer comando que interaja com o banco local (como `prisma:migrate`, `prisma:studio` ou scripts `db:populate`)
- Hot reload = servidor reinicia automaticamente ao salvar arquivos
- Se mudar o schema do Prisma, re-gere o cliente: `npm run prisma:generate`
- Para visualizar dados do BD: `npm run prisma:studio` (ex: `NODE_ENV=localdb npm run prisma:studio`)

## Scripts disponíveis

### Desenvolvimento

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor com hot reload |
| `npm run build` | Compila TypeScript |
| `npm run start` | Inicia servidor compilado |

### Banco de dados

| Script | Descrição |
|--------|-----------|
| `npm run prisma:generate` | Gera cliente Prisma |
| `npm run prisma:migrate` | Executa migrations |
| `npm run prisma:studio` | Abre Prisma Studio na web |
| `npm run db:populate` | Popula dados iniciais do feed |
| `npm run db:populate:club-notifications` | Popula notificações de clubes |
| `npm run db:populate:search` | Popula dados para testes de busca |
| `npm run db:inspect-user` | Inspeciona tabela de usuários |

### Testes

| Script | Descrição |
|--------|-----------|
| `npm test` | Executa todos os testes |
| `npm test -- --watch` | Executa testes em modo watch |
| `npm run test:prepare` | Reseta banco de testes |
| `npm run test:full` | Reseta banco + executa testes |

### Limpeza

| Script | Descrição |
|--------|-----------|
| `npm run notifications:cleanup` | Remove notificações antigas |

## Estrutura de diretórios

```text
backend/
├── prisma/                          # Configurações do banco de dados (ORM Prisma)
│   ├── migrations/                  # Histórico de alterações feitas no banco de dados (tabelas e campos criados)
│   └── schema.prisma                # Definição e modelagem das tabelas do banco de dados
├── src/                             # Código-fonte principal do servidor
│   ├── controllers/                 # Controladores: recebem requisições HTTP e enviam as respostas
│   │   ├── app-info/                # Retorna informações básicas e versão atual do sistema
│   │   ├── auth/                    # Fluxo de autenticação: login, cadastro e redefinição de senha
│   │   ├── clubs/                   # Gerenciamento de clubes (grupos de amigos): criação, membros e cargos
│   │   ├── dares/                   # Criação de desafios (dares) e recebimento de provas
│   │   ├── feed/                    # Geração do feed principal de publicações
│   │   ├── search/                  # Execução de buscas por usuários, clubes e conteúdos
│   │   ├── support/                 # Gerenciamento de suporte e denúncias de abuso
│   │   ├── truths/                  # Criação de verdades (truths) e comentários/respostas
│   │   ├── uploads/                 # Geração de URLs seguras para upload de imagens
│   │   ├── users/                   # Perfis de usuário, sessões de login e preferências
│   │   └── notifications.controller.ts # Controlador de recebimento e leitura de notificações
│   ├── services/                    # Serviços: lógica de negócios e comunicação com o banco de dados
│   │   ├── app-info/                # Lógica de informações básicas do aplicativo
│   │   ├── auth/                    # Lógica para registro, login e fluxo de redefinição de senha
│   │   ├── clubs/                   # Lógica para regras de grupos, cargos, convites e auditoria
│   │   ├── dares/                   # Lógica de desafios e processamento de respostas de prova
│   │   ├── feed/                    # Lógica de montagem e ordenação inteligente do feed
│   │   ├── likes/                   # Lógica compartilhada de curtidas em posts, comentários e clubes
│   │   ├── notifications/           # Lógica de criação, listagem e leitura de notificações
│   │   ├── observability/           # Configuração de logs, métricas e monitoramento do servidor
│   │   ├── search/                  # Lógica de consultas com filtros e paginação
│   │   ├── support/                 # Lógica de processamento de abusos e denúncias
│   │   ├── truths/                  # Lógica de criação e comentários de perguntas de verdade
│   │   ├── uploads/                 # Integração com armazenamento de imagens (Supabase Storage)
│   │   ├── users/                   # Lógica de controle de perfis, sessões ativas e preferências
│   │   ├── notifications-retention.service.ts # Exclusão periódica automática de notificações antigas
│   │   └── pagination.ts            # Utilitário para padronização de paginação de listas de dados
│   ├── routes/                      # Rotas: mapeia os caminhos de URL (endpoints) para os controladores
│   │   ├── app-info/                # Rotas para consulta de versão e status da aplicação
│   │   ├── auth/                    # Rotas de acesso e redefinição de segurança da conta
│   │   ├── clubs/                   # Rotas para interações de clubes (criar, moderar, listar membros, feed)
│   │   ├── dares/                   # Rotas de gerenciamento e respostas de desafios
│   │   ├── feed/                    # Rota do feed de notícias principal da rede social
│   │   ├── search/                  # Rotas de buscador geral, usuários recomendados e clubes em alta
│   │   ├── support/                 # Rota para envio de relatórios de denúncia
│   │   ├── truths/                  # Rotas para perguntas do tipo verdade e seus comentários
│   │   ├── uploads/                 # Rota para assinatura de links temporários de upload de mídia
│   │   ├── users/                   # Rotas de perfil privado, perfil público, preferências e sessões
│   │   └── notifications.routes.ts  # Rotas de gerenciamento de notificações
│   ├── middlewares/                 # Middlewares: interceptam requisições HTTP para validação ou segurança
│   │   ├── auth.middleware.ts       # Valida se o usuário está logado a partir do token JWT
│   │   └── rate-limit.middleware.ts # Limita requisições repetitivas para evitar ataques de sobrecarga
│   ├── dtos/                        # DTOs: define e valida a estrutura dos dados nas entradas da API
│   │   ├── clubs.dto.ts             # Estrutura de dados aceita para criação e edição de clubes
│   │   └── notifications.dto.ts     # Estrutura de dados aceita para leitura de notificações
│   ├── utils/                       # Utilitários globais do código
│   │   └── jwt.ts                   # Helpers para geração e decodificação de tokens JWT de autenticação
│   ├── lib/                         # Clientes e conexões de APIs de terceiros
│   │   ├── prisma.ts                # Inicialização e conexão com o banco PostgreSQL usando Prisma ORM
│   │   └── supabase.ts              # Inicialização do cliente Supabase para armazenamento de fotos
│   ├── test-utils/                  # Utilitários para criação de dados mockados durante testes
│   ├── app.ts                       # Setup geral da aplicação Express (CORS, JSON parser e registro de rotas)
│   └── server.ts                    # Inicializador do servidor HTTP que roda o backend
├── tests/                           # Testes automatizados de integração e de serviços (Jest)
├── scripts/                         # Scripts rápidos auxiliares para desenvolvimento
│   ├── cleanup-notifications.ts     # Script manual para apagar notificações vencidas no banco
│   ├── inspect-user-table.ts        # Script auxiliar para verificação rápida de usuários cadastrados
│   ├── populate-club-notifications.ts # Cria dados falsos de notificações de grupos para testes de interface
│   ├── populate-feed.ts             # Cria um cenário simulado no feed com usuários, verdades e desafios
│   ├── populate-search.ts           # Popula o banco com dezenas de registros para testar a pesquisa
│   └── run-prisma-test-command.ts   # Helper para aplicar comandos Prisma no banco de dados de testes
├── performance/                     # Configurações para testes de sobrecarga (Artillery)
│   └── auth-load.yml                # Configuração para testar velocidade de login sob carga massiva
├── .env                             # Arquivo contendo variáveis de ambiente de produção (Ignorado pelo Git)
├── .env.localdb                     # Configurações de conexão para o banco de dados PostgreSQL local
├── .env.test                        # Configurações de banco de dados para a execução dos testes automatizados
├── run-local.example.ps1            # Modelo de script para configurar e iniciar o backend no Windows
├── run-local.ps1                    # Script ativo que roda o backend localmente no Windows (Ignorado pelo Git)
├── tsconfig.json                    # Arquivo de configuração de compilação do TypeScript
├── package.json                     # Listagem de dependências, pacotes instalados e scripts de atalho do projeto
└── README.md                        # Documentação técnica do backend (este arquivo)
```

## Rotas principais

### 🔐 Autenticação

- `POST /auth/signup` - Cadastro de novo usuário
- `POST /auth/login` - Login
- `POST /auth/change-email` - Alterar e-mail do usuário autenticado
- `POST /auth/change-password` - Alterar senha do usuário autenticado
- `POST /auth/forgot-password` - Solicitação de recuperação de senha (envia código)
- `POST /auth/verify-reset-code` - Verificação de código de reset de senha
- `POST /auth/reset-password` - Redefinição de senha

### 📰 Feed

- `GET /feed` - Feed principal com desafios

### 🎯 Desafios (Dares)

- `POST /dares` - Criar novo desafio (dare)
- `DELETE /dares/:id` - Deletar desafio
- `POST /dares/:id/proof` - Enviar prova (resposta) a um desafio
- `GET /dares/proofs/:proofId` - Detalhes da prova (resposta) enviada

### 💬 Verdades (Truths)

- `POST /truths` - Criar nova verdade (truth)
- `DELETE /truths/:id` - Deletar verdade
- `GET /truths/:id/comments` - Listar comentários/respostas de uma verdade
- `POST /truths/:id/comments` - Enviar comentário/resposta para uma verdade
- `PATCH /truths/comments/:id` - Editar comentário/resposta de uma verdade
- `DELETE /truths/comments/:id` - Excluir comentário/resposta de uma verdade
- `POST /truths/comments/:id/report` - Denunciar comentário de uma verdade
- `POST /truths/:id/report` - Denunciar uma verdade

### 👤 Usuários

- `GET /users` - Buscar/listar usuários
- `GET /users/me` - Perfil completo do usuário logado
- `PUT /users/me` - Atualizar perfil do usuário logado
- `PATCH /users/me` - Atualizar dados da conta do usuário logado
- `DELETE /users/me` - Deletar conta do usuário logado
- `GET /users/me/preferences` - Obter preferências do usuário logado
- `PUT /users/me/preferences` - Atualizar preferências do usuário logado
- `GET /users/me/sessions` - Listar sessões do usuário logado
- `DELETE /users/me/sessions` - Revogar outras sessões do usuário logado
- `DELETE /users/me/sessions/:id` - Revogar sessão específica do usuário logado
- `GET /users/:id/public` - Obter perfil público de outro usuário

### 🔍 Busca

- `GET /search` - Busca geral de usuários, clubes e conteúdo
- `GET /search/users` - Buscar usuários
- `GET /search/clubs` - Buscar clubes
- `GET /search/content` - Buscar conteúdo (desafios)
- `GET /search/recommended/users` - Obter usuários recomendados
- `GET /search/trending/clubs` - Obter clubes em alta

### 👥 Clubes

- `POST /clubs` - Criar novo clube
- `GET /clubs/my` - Listar meus clubes
- `GET /clubs/discover` - Descobrir novos clubes
- `GET /clubs/search` - Buscar clubes
- `GET /clubs/:id` - Detalhes do clube
- `PATCH /clubs/:id` - Atualizar configurações do clube
- `DELETE /clubs/:id` - Arquivar clube
- `POST /clubs/:id/restore` - Restaurar clube
- `GET /clubs/:id/members` - Listar membros do clube
- `POST /clubs/:id/members/:userId/remove` - Remover membro do clube
- `POST /clubs/:id/members/:userId/block` - Bloquear membro do clube
- `POST /clubs/:id/members/:userId/suspend-posting` - Suspender postagens de um membro
- `PATCH /clubs/:id/members/:userId/role` - Atualizar cargo de um membro
- `POST /clubs/:id/join` - Entrar em um clube (se público)
- `POST /clubs/:id/join-requests` - Solicitar entrada em um clube (se privado)
- `POST /clubs/:id/leave` - Sair de um clube
- `POST /clubs/:id/mute` - Silenciar notificações do clube
- `POST /clubs/:id/unmute` - Reativar notificações do clube
- `POST /clubs/:id/invites` - Convidar usuário para o clube
- `GET /clubs/invites/my` - Listar meus convites de clubes
- `POST /clubs/invites/:id/accept` - Aceitar convite de clube
- `POST /clubs/invites/:id/decline` - Recusar convite de clube
- `POST /clubs/join-requests/:id/approve` - Aprovar solicitação de entrada
- `POST /clubs/join-requests/:id/reject` - Rejeitar solicitação de entrada
- `GET /clubs/:id/audit-logs` - Listar logs de auditoria do clube
- `POST /clubs/:id/report` - Denunciar clube

#### 📰 Feed e Prompts de Clubes
- `GET /clubs/feed` - Feed agregado de todos os meus clubes
- `GET /clubs/:id/feed` - Feed de prompts de um clube específico
- `POST /clubs/:id/feed/seen` - Marcar feed do clube como visualizado
- `POST /clubs/:id/prompts` - Criar novo prompt de desafio no clube
- `GET /clubs/:id/prompts/:promptId` - Detalhes de um prompt de clube
- `PATCH /clubs/:id/prompts/:promptId` - Atualizar prompt de clube
- `DELETE /clubs/:id/prompts/:promptId` - Moderar (excluir) prompt de clube
- `POST /clubs/:id/prompts/:promptId/like` - Curtir/descurtir prompt de clube
- `POST /clubs/:id/prompts/:promptId/report` - Denunciar prompt de clube
- `POST /clubs/:id/prompts/:promptId/responses` - Responder prompt de clube (evidência)
- `GET /clubs/:id/prompts/:promptId/responses` - Listar respostas de um prompt
- `POST /clubs/:id/prompts/:promptId/responses/:responseId/like` - Curtir/descurtir resposta de prompt
- `POST /clubs/:id/prompts/:promptId/responses/:responseId/report` - Denunciar resposta de prompt
- `POST /clubs/:id/prompts/:promptId/comments` - Enviar comentário em um prompt
- `POST /clubs/:id/prompts/:promptId/comments/:commentId/report` - Denunciar comentário de prompt

### ❤️ Likes

- `POST /truths/:id/like` - Curtir/descurtir verdade
- `POST /truths/comments/:id/like` - Curtir/descurtir resposta/comentário de verdade
- `POST /dares/:id/like` - Curtir/descurtir desafio
- `POST /clubs/:id/like` - Curtir/descurtir clube

### 📤 Uploads

- `POST /uploads/sign` - Gerar URL assinada para upload no Supabase Storage

### 🔔 Notificações

- `GET /notifications` - Listar notificações do usuário
- `GET /notifications/unread` - Contar notificações não lidas
- `PUT /notifications/:id/read` - Marcar notificação como lida
- `DELETE /notifications/:id` - Deletar notificação

### 🆘 Suporte

- `POST /support/report-abuse` - Denunciar abuso/conteúdo impróprio

### ℹ️ Informações da App

- `GET /app-info` - Obter informações de versão e configurações públicas da aplicação


## Configuração para testes

O projeto inclui testes automatizados com Jest + Supertest. Para rodar os testes:

```bash
# Preparar banco de testes (reseta migrations)
npm run test:prepare

# Executar todos os testes
npm test

# Executar testes com cobertura
npm test -- --coverage

# Executar teste específico
npm test -- password-reset.routes.test.ts

# Modo watch
npm test -- --watch
```

**Nota:** Os testes usam um banco de dados separado (`truth_or_dare_test`) configurado automaticamente. Certifique-se de que o PostgreSQL está rodando.

## Notas de desenvolvimento

### Organização por domínio

O código segue uma estrutura **domain-driven design** (DDD), onde cada domínio é uma unidade coesa:

| Domínio | Responsabilidade |
|---------|------------------|
| `auth/` | Autenticação, registro, recuperação de senha, JWT |
| `feed/` | Feed principal, timeline de desafios |
| `dares/` | Criação e gerenciamento de desafios |
| `truths/` | Criação e gerenciamento de verdades |
| `clubs/` | Criação de clubes, gerenciamento de membros |
| `search/` | Busca de usuários, desafios, clubes com paginação |
| `users/` | Perfis de usuário, relacionamentos (follow) |
| `notifications/` | Notificações, alertas, limpeza automática |
| `likes/` | Sistema de likes em desafios e respostas |
| `uploads/` | Upload de imagens, validação, armazenamento |
| `support/` | Denúncias, feedback de usuários |
| `app-info/` | Versão, configurações públicas |

Cada domínio contém:
- **controller/**: Recebe requests HTTP
- **service/**: Lógica de negócio
- **routes/**: Define endpoints
- **dtos/**: Validação de entrada e saída

### Features principais

#### Notificações com retenção automática
O serviço `notifications-retention.service.ts` limpa notificações antigas automaticamente:
```bash
npm run notifications:cleanup
```

#### Paginação
O serviço `pagination.ts` padroniza listagens com limite, offset e ordenação.

#### Observabilidade
O módulo `observability/` fornece logging estruturado para monitoramento.

#### Testes de performance
A pasta `performance/` contém testes com Artillery para validar:
- Throughput do servidor
- Latência de endpoints críticos
- Comportamento sob carga

### TypeScript strict mode

O projeto é configurado com `"strict": true`. Isso significa:

- ✔️ Sem `any` implícito
- ✔️ Tipos explícitos em variáveis e funções
- ✔️ Null/undefined safety
- ✔️ Validação de tipos rigorosa

**Exemplo:**
```typescript
// ✅ Correto
function getUserById(id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ Errado
function getUser(id) {  // Sem tipos!
  return prisma.user.findUnique({ where: { id } });
}
```

### Migrations

Migrations são gerenciadas com Prisma. Para trabalhar com elas:

```bash
# Criar uma nova migration após editar schema.prisma
npm run prisma:migrate
# Será solicitado um nome (ex: "add_user_avatar")

# Gerar apenas (sem executar)
prisma migrate dev --name nome_migration --create-only

# Deploy em produção (sem modo interativo)
npm run test:db:deploy

# Ver histórico
prisma migrate status

# Resetar tudo (apenas em desenvolvimento)
prisma migrate reset
```

**Boas práticas:**
- Escreva migrations em passos pequenos e logísticos
- Sempre teste migrations localmente antes de fazer push
- Não delete migrations, crie novas se houver erro
- Descreva mudanças no commit da migration

### Rate limiting

O backend implementa rate limiting para endpoints sensíveis:
- **Autenticação** (login, register): máx 5 tentativas por IP/minuto
- **Recuperação de senha**: máx 3 tentativas por email/minuto
- **Verificação de código**: máx 5 tentativas por token

### Segurança

- ✅ Senhas hasheadas com bcrypt (10+ rounds)
- ✅ JWT com expiração + refresh tokens
- ✅ CORS configurado por domínio
- ✅ Validação de entrada com DTOs em todos endpoints
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Sanitização de dados de entrada
- ✅ Rate limiting em endpoints sensíveis
- ✅ Tokens de reset com TTL (time-to-live)
- ✅ E-mails não revelam existência de usuários

## Documentação recomendada

- [Documentação Prisma](https://www.prisma.io/docs/)
- [Documentação Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/) - Explicação sobre JSON Web Tokens
- [OWASP](https://owasp.org/www-project-top-ten/) - Práticas de segurança

## Exemplos de Uso

### Testar API localmente com curl

```bash
# 1. Registrar novo usuário
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaForte123!",
    "username": "usuario"
  }'

# Resposta:
# {
#   "user": { "id": 1, "email": "usuario@example.com", ... },
#   "tokens": { "accessToken": "eyJxxx...", "refreshToken": "eyJyyy..." }
# }

# 2. Fazer login
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaForte123!"
  }'

# 3. Acessar endpoint autenticado
curl -X GET http://localhost:3333/auth/me \
  -H "Authorization: Bearer eyJxxx..."
```

### Usando Postman/Insomnia

1. Importe `insomnia-collection.json` (se disponível)
2. Configure `{{BASE_URL}}` como `http://localhost:3333`
3. Configure `{{ACCESS_TOKEN}}` após fazer login
4. Use as rotas em Collections

### Integração no Frontend

```typescript
// services/api.ts
const API_BASE = "http://localhost:3333";

export async function register(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username: email.split("@")[0] }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  localStorage.setItem("accessToken", data.tokens.accessToken);
  return data;
}

export async function getFeed(token: string) {
  const res = await fetch(`${API_BASE}/feed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
```

## Documentação recomendada

- [Documentação Prisma](https://www.prisma.io/docs/)
- [Documentação Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/) - Explicação sobre JSON Web Tokens
- [OWASP](https://owasp.org/www-project-top-ten/) - Práticas de segurança

## Deployment

### Preparação para produção

```bash
# 1. Build TypeScript
npm run build

# 2. Verificar se ficou tudo OK
ls -la dist/

# 3. Deploy migrations no BD de produção
npm run test:db:deploy

# 4. Iniciar servidor
npm run start
```

### Variáveis de ambiente de produção

Em produção, crie um arquivo `.env` na raiz (não commitar!) com:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/truth_or_dare
DIRECT_URL=postgresql://user:pass@prod-db.example.com:5432/truth_or_dare
JWT_SECRET=<gerar-chave-segura-128-bits>
JWT_REFRESH_SECRET=<gerar-chave-segura-128-bits>
PORT=3000
```

### Monitoramento

Em produção, recomenda-se:
- Logging estruturado com observability module
- Alertas para erros de autenticação
- Monitoramento de performance com Artillery
- Backup automático do banco de dados
- Health checks em `/health`

### Erro de conexão com banco

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução:** Verifique se PostgreSQL está rodando e se as credenciais em `DATABASE_URL` estão corretas.

### Erro de migration

```
Error: P3014 Prisma Migrate could not create the shadow database
```

**Solução:** Certifique-se de que o usuário PostgreSQL tem permissão para criar bancos. Ou configure `shadowDatabaseUrl` no `prisma/schema.prisma`.

### Porta já em uso

```
Error: listen EADDRINUSE :::3333
```

**Solução:** Mude a porta no arquivo `.env` ou mate o processo usando a porta:
```bash
# Windows
netstat -ano | findstr :3333
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3333 | xargs kill -9
```

### Módulos não encontrados após npm install

```bash
npm install
npm run prisma:generate
```

## Testes de Performance

O projeto inclui testes de carga com Artillery para validar performance:

```bash
# Executar teste de performance
cd performance
artillery run load-test.yml
```

**Métricas monitoradas:**
- Throughput (requisições/segundo)
- Latência (p50, p95, p99)
- Taxa de erro
- Uso de memória

## Contribuindo

Para contribuir com novas features ou correções:

### Workflow

1. **Crie uma branch descritiva:**
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ou
   git checkout -b fix/correcao-bug
   ```

2. **Implemente a feature/correção**
   - Siga a estrutura por domínios
   - Adicione tipos TypeScript
   - Crie DTOs para validação
   - Implemente testes

3. **Execute os testes:**
   ```bash
   npm run test:full
   ```

4. **Commit e Push:**
   ```bash
   git commit -m "feat: descrição clara da mudança"
   git push origin feature/nova-funcionalidade
   ```

5. **Abra um Pull Request** com descrição das mudanças

### Padrões de código

- **Nomes descritivos**: `createUserWithEmailVerification()` não `doStuff()`
- **Types explícitos**: Sempre use tipos TypeScript
- **DTOs para validação**: Classes com decorators para validar entrada
- **Tratamento de erro**: Use try/catch com mensagens claras
- **Logs**: Use observability module para logs estruturados

### Before submitting PR

- ✅ Todos os testes passam: `npm run test:full`
- ✅ Code compila sem errors: `npm run build`
- ✅ Tipos estão corretos: `npx tsc --noEmit`
- ✅ Performance aceitável (sem queries N+1)
- ✅ Cobertura de testes adequada

## Licença

Este projeto é propriedade privada.
