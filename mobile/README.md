# Truth or Dare Async Network - Mobile

Aplicativo mobile para a plataforma Truth or Dare, desenvolvido com React Native e Expo. Uma rede social assíncrona onde usuários criam e participam de desafios de forma flexível, sem necessidade de todos estarem online simultaneamente.

## 📌 Índice

- [Análise técnica do projeto](#análise-técnica-do-projeto)
  - [Stack principal](#stack-principal)
  - [Arquitetura (resumo)](#arquitetura-resumo)
  - [Dependências externas e conectividade](#dependências-externas-e-conectividade)
- [Requisitos técnicos](#requisitos-técnicos)
  - [Ambiente local](#ambiente-local)
  - [Ferramentas recomendadas](#ferramentas-recomendadas)
- [Como iniciar o projeto](#como-iniciar-o-projeto)
  - [Opção 1: Expo Go (Recomendado para desenvolvimento rápido)](#opção-1-expo-go-recomendado-para-desenvolvimento-rápido)
  - [Opção 2: Emulador/Simulador (Desenvolvimento completo)](#opção-2-emuladorsimulador-desenvolvimento-completo)
- [Scripts disponíveis](#scripts-disponíveis)
  - [Desenvolvimento](#desenvolvimento)
  - [Quality Assurance](#quality-assurance)
  - [Utilitários](#utilitários)
- [Script de Atualização de IP (update_mobile_env_ip.py)](#-script-de-atualização-de-ip-update_mobile_env_ippy)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Telas principais](#telas-principais)
  - [Autenticação](#-autenticação)
  - [Feed Principal](#-feed-principal)
  - [Ações](#-ações)
  - [Clubes](#-clubes)
  - [Perfil](#-perfil)
  - [Busca](#-busca)
  - [Notificações](#-notificações)
- [Configuração para desenvolvimento](#configuração-para-desenvolvimento)
  - [Mock API](#mock-api)
  - [Tema e Design System](#tema-e-design-system)
  - [Cache com AsyncStorage](#cache-com-asyncstorage)
- [Testes](#testes)
- [Notas de desenvolvimento](#notas-de-desenvolvimento)
  - [Organização por feature](#organização-por-feature)
  - [File-based routing (Expo Router)](#file-based-routing-expo-router)
  - [TypeScript Strict](#typescript-strict)
  - [Cache strategy](#cache-strategy)
  - [Navegação](#navegação)
- [Troubleshooting](#troubleshooting)
  - [Erro: "Cannot find module 'expo'"](#erro-cannot-find-module-expo)
  - [Emulador/Simulador não conecta](#emuladorsimulador-não-conecta)
  - [Erro de dependência Expo](#erro-de-dependência-expo)
  - [Cache corrompido](#cache-corrompido)
  - [Problema com AsyncStorage](#problema-com-asyncstorage)
- [Builds e Distribuição](#builds-e-distribuição)
  - [Preview (desenvolvimento)](#preview-desenvolvimento)
  - [Build Android](#build-android)
  - [Build iOS](#build-ios)
  - [Build Web](#build-web)
- [Documentação recomendada](#documentação-recomendada)
- [Contribuindo](#contribuindo)
  - [Workflow](#workflow)
  - [Padrões de código](#padrões-de-código)
  - [Before submitting PR](#before-submitting-pr)
- [Licença](#licença)

## Análise técnica do projeto

### Stack principal

- **React Native 0.81.5** com React 19.1.0
- **Expo ~54.0.33** para build e distribuição
- **Expo Router v6** para navegação baseada em arquivos
- **React Navigation v7** para abas e navegação nativa
- **TypeScript** em modo `strict`
- **Jest + React Native Testing Library** para testes
- **Expo Audio** para integração de áudio
- **Expo Image Picker** para câmera e galeria

### Arquitetura (resumo)

- `app/`: Rotas e telas do Expo Router (file-based routing)
  - `app/(tabs)/`: Abas principais (Feed, Explore, Profile, Notifications)
  - `app/clubs/`: Fluxo de clubes
  - `app/profile/`: Fluxo de perfil
  - `app/_layout.tsx`: Layout raiz com autenticação

- `components/`: Componentes reutilizáveis por feature
  - `auth-recovery/`: Componentes de recuperação de senha
  - `feed/`: Componentes do feed
  - `clubs/`: Componentes de clubes
  - `profile/`: Componentes de perfil
  - `ui/`: Componentes base (Button, Input, etc)

- `services/`: Integração com API e armazenamento local
  - `api.ts`: Cliente HTTP para backend
  - `cachedApi.ts`: Cache de respostas com AsyncStorage
  - `clubsApi.ts`: Endpoints específicos de clubes
  - `mediaPicker.ts`: Integração com câmera/galeria
  - `uploads.ts`: Upload de arquivos

- `hooks/`: Hooks customizados por feature
  - `useActionScreen.ts`: Lógica de câmera e captura
  - `useFeedState.ts`: Estado do feed
  - `useClubDetailsScreen.ts`: Detalhes de clube
  - `useNotificationsScreen.ts`: Gerenciamento de notificações

- `context/`: Contextos globais
  - `ThemeContext.tsx`: Tema (light/dark)
  - `RecoveryFlowContext.tsx`: Estado de recuperação de senha

- `constants/`: Configurações e constantes
  - `theme.ts`: Tokens de design
  - `*Theme.ts`: Temas específicos por tela

- `types/`: Definições de tipos TypeScript
- `data/`: Mock data e fixtures para desenvolvimento

### Dependências externas e conectividade

- **Backend API** em `http://localhost:3333` (desenvolvimento)
- **AsyncStorage** para persistência local de:
  - Tokens de autenticação
  - Cache de feed
  - Histórico de buscas
  - Preferências do usuário
- **Câmera e Galeria** do dispositivo
- **Acesso a áudio** para features futuras

## Requisitos técnicos

### Ambiente local

- **Node.js LTS** (recomendado: 20+)
- **npm** (ou yarn/pnpm)
- **Expo CLI**: `npm install -g expo-cli`
- **Android Studio** (para emulador Android)
- **Xcode** (para simulador iOS - macOS)
- **Git** para clonar o repositório

### Ferramentas recomendadas

- **Expo Go** app (testes rápidos em dispositivo)
- **VS Code** com extensões:
  - ES7+ React/Redux/React-Native snippets
  - Prettier
  - ESLint
- **Android Emulator** ou **iOS Simulator**
- **React Developer Tools** (DevTools)

## Como iniciar o projeto

### Opção 1: Expo Go (Recomendado para desenvolvimento rápido)

**Expo Go** é a forma mais rápida para visualizar o app enquanto desenvolvendo, sem necessidade de emuladores.

**Passo 1:** Instale o app Expo Go no seu dispositivo
- [Expo Go no Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- [Expo Go na App Store](https://apps.apple.com/app/expo-go/id1054318258)

**Passo 2:** Clone e instale

```bash
git clone https://github.com/pedrolabre/truth-or-dare-async-network.git
cd truth-or-dare-async-network/mobile
npm install
```

**Passo 3:** Configure o .env.local

```bash
python scripts/update_mobile_env_ip.py  # (No macOS/Linux, utilize python3)
```

**Passo 4:** Inicie o servidor Expo

```bash
npx expo start
```

**Passo 5:** Escaneie o QR code
- Abra o app Expo Go
- Toque em "Scan QR Code"
- Aponte câmera para o QR code exibido no terminal
- O app carregará em segundos!

### Opção 2: Emulador/Simulador (Desenvolvimento completo)

**Passo 1:** Clone e instale

```bash
git clone https://github.com/pedrolabre/truth-or-dare-async-network.git
cd truth-or-dare-async-network/mobile
npm install
```

**Passo 2:** Configure o .env.local

```bash
# Para localhost (funciona bem em emulador local)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3333  # Android
EXPO_PUBLIC_API_URL=http://localhost:3333  # iOS
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_ENVIRONMENT=development
```



**Variáveis de ambiente:**

| Variável | Descrição | Exemplo | Ambiente |
|----------|-----------|---------|----------|
| `EXPO_PUBLIC_API_URL` | URL do backend | `http://10.0.2.2:3333` (Android em emu) / `http://localhost:3333` (iOS) / `http://192.168.1.100:3333` (físico) | `.env.local` |
| `EXPO_PUBLIC_API_TIMEOUT` | Timeout de requisições (ms) | `10000` | `.env.local` |
| `EXPO_PUBLIC_ENVIRONMENT` | Ambiente | `development`, `staging`, `production` | `.env.local` |

**Passo 3:** Inicie no emulador/simulador

```bash
# Apenas Android (necessita Android Studio)
npm run android

# Apenas iOS (apenas macOS, necessita Xcode)
npm run ios

# Apenas Web
npm run web
```

**Opção 3: Tunnel (Testar em rede real)**

Útil para testar em dispositivo real sem local network:

```bash
npm run start:tunnel

# Escaneie o QR code com Expo Go
```

**Troubleshooting:**

```bash
# Limpar cache e reiniciar
npm run start:clear

# Diagnóstico Expo
npm run doctor

# Corrigir dependências
npm run fix-deps
```

## Scripts disponíveis

### Desenvolvimento

| Script | Descrição |
|--------|-----------|
| `npx expo start` | Inicia Expo dev server (use este para Expo Go) |
| `npm start` | Alias para `expo start` |
| `npm run start:clear` | Limpa cache e reinicia |
| `npm run start:tunnel` | Inicia em tunnel para rede |
| `npm run android` | Abre no emulador Android |
| `npm run ios` | Abre no simulador iOS |
| `npm run web` | Abre no navegador |

### Quality Assurance

| Script | Descrição |
|--------|-----------|
| `npm run lint` | Executa ESLint |
| `npm test` | Executa testes Jest |
| `npm run doctor` | Diagnóstico Expo |
| `npm run fix-deps` | Corrige dependências Expo |

### Utilitários

| Script | Descrição |
|--------|-----------|
| `npm run reset-project` | Reseta estrutura de pastas |
| `python scripts/update_mobile_env_ip.py` | Atualiza IP local no `.env.local` |

## 🔄 Script de Atualização de IP (`update_mobile_env_ip.py`)

Este script é **essencial** para desenvolvimento com emuladores/dispositivos, pois automatiza a atualização do IP local.

### Por que é necessário?

- Emuladores e dispositivos **não conseguem acessar `localhost`** da sua máquina
- Precisam do **IP local real** (ex: `192.168.1.100`)
- Quando você troca de rede, o IP muda - o script detecta e atualiza automaticamente

### Como usar

**Windows:**
```bash
python scripts/update_mobile_env_ip.py
```

**macOS/Linux:**
```bash
python3 scripts/update_mobile_env_ip.py
```

### O que o script faz

1. **Detecta** o IP local da sua máquina
2. **Atualiza** `EXPO_PUBLIC_API_URL` no `.env.local`
3. **Mantém** outras variáveis intactas
4. **Exemplo:** 
   ```bash
   # Antes
   EXPO_PUBLIC_API_URL=http://192.168.1.50:3333
   
   # Depois (se IP mudar para .100)
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3333
   ```

### Quando usar

- 🔄 **Toda vez** que reconectar na rede
- 🔄 **Toda vez** que trocar de rede (Wi-Fi)
- 🔄 **Primeira vez** que clonar o projeto
- ✅ **Após** rodar o setup inicial

### Resultado esperado

```bash
$ python scripts/update_mobile_env_ip.py
✓ IP local detectado: 192.168.1.100
✓ .env.local atualizado com sucesso!
✓ EXPO_PUBLIC_API_URL = http://192.168.1.100:3333
```

## Estrutura de diretórios

```text
mobile/
├── .env.local                     # Variáveis de ambiente locais (IP do backend, porta, etc.)
├── .env.production                # Variáveis de ambiente para build de produção
├── README.md                      # Documentação técnica do aplicativo (este arquivo)
├── app.json                       # Configurações gerais do Expo (nome, ícones, Splash, etc.)
├── babel.config.js                # Configurações do compilador Babel
├── eslint.config.js               # Regras de padronização e estilo de código
├── metro.config.js                # Configuração do empacotador Metro (gerenciador de assets)
├── package.json                   # Scripts de execução e dependências do projeto
├── tsconfig.json                  # Configurações do compilador TypeScript
├── app/                           # Diretório principal de rotas (Expo Router baseado em arquivos)
│   ├── _layout.tsx                # Layout raiz do app (gerencia fontes, temas e estado de login)
│   ├── action-screen.tsx          # Tela de câmera integrada para capturar fotos/vídeos de desafios
│   ├── clubs.tsx                  # Tela que lista os clubes do usuário
│   ├── create-challenge.tsx       # Tela para criação de novos desafios de Verdade ou Desafio
│   ├── create-group.tsx           # Tela para criação de novos clubes/grupos
│   ├── feed-comments.tsx          # Tela de comentários e respostas de um post
│   ├── feed.tsx                   # Tela do Feed principal (postagens e atividades)
│   ├── forgot-password.tsx        # Tela de solicitação de recuperação de senha
│   ├── index.tsx                  # Tela de entrada principal (redireciona para login ou feed)
│   ├── login.tsx                  # Tela de Login do usuário
│   ├── modal.tsx                  # Modal geral do sistema de rotas
│   ├── notifications.tsx          # Tela de notificações recebidas pelo usuário
│   ├── password-success.tsx       # Tela de confirmação de alteração de senha
│   ├── profile.tsx                # Tela do perfil do próprio usuário logado
│   ├── proof-detail.tsx           # Tela de detalhes de uma prova (desafio respondido)
│   ├── reset-password.tsx         # Tela de definição de nova senha
│   ├── search.tsx                 # Tela de buscas do aplicativo (usuários, clubes, etc.)
│   ├── settings.tsx               # Tela de configurações de conta e privacidade do aplicativo
│   ├── signup-screen.tsx          # Tela de cadastro de novos usuários
│   ├── verify-code.tsx            # Tela para digitar o código de verificação enviado por e-mail
│   ├── (tabs)/                    # Subpastas para navegação inferior em abas
│   │   ├── _layout.tsx            # Layout e estilização das abas inferiores
│   │   ├── explore.tsx            # Aba de descoberta de clubes e perfis em alta
│   │   └── index.tsx              # Aba inicial (redireciona para o feed)
│   ├── clubs/                     # Sub-rotas dinâmicas de clubes
│   │   └── [id].tsx               # Tela de detalhes de um clube específico (busca por ID)
│   └── profile/                   # Sub-rotas dinâmicas de perfis externos
│       └── [id].tsx               # Tela de perfil público de outro usuário (busca por ID)
├── assets/                        # Arquivos estáticos (imagens, ícones e fontes)
│   ├── icons/                     # Ícones e logotipos utilizados no aplicativo
│   └── images/                    # Imagens de fundo, splash screen e imagens padrão
├── components/                    # Componentes visuais reutilizáveis organizados por tela/funcionalidade
│   ├── LoginLogo.tsx              # Componente que exibe a logomarca na tela de login
│   ├── external-link.tsx          # Abre links externos no navegador padrão do celular
│   ├── haptic-tab.tsx             # Botão de aba com resposta física de vibração ao toque
│   ├── hello-wave.tsx             # Componente de animação simples (mão acenando)
│   ├── parallax-scroll-view.tsx   # Efeito visual de imagem de fundo rolando em velocidade diferente
│   ├── themed-text.tsx            # Texto que adapta sua cor ao tema claro ou escuro do sistema
│   ├── themed-view.tsx            # Container (View) que adapta sua cor ao tema ativo
│   ├── account/                   # Componentes específicos de gerenciamento da conta
│   ├── action/                    # Componentes da câmera, botões e cartões de captura
│   ├── auth-recovery/             # Componentes visuais do fluxo de recuperação de senha
│   ├── clubs/                     # Cards, painéis, listas de membros e modais de clubes
│   ├── create-challenge/          # Compositor, seletores de alvo e tipo de novos desafios
│   ├── create-group/              # Formulários, seletores de ícones e membros de novos grupos
│   ├── feed/                      # Lista de posts, filtros e cabeçalho do feed principal
│   ├── feed-comments/             # Itens de comentário, modais de denúncia e compositor de respostas
│   ├── media/                     # Campos e botões para escolha/edição de fotos e áudio
│   ├── notifications/             # Cartões, badges e estados (vazio/erro) de notificações
│   ├── profile/                   # Grade de estatísticas, conquistas e cartões do perfil do usuário
│   ├── proof-detail/              # Visualizadores de mídia, ações e cabeçalho de respostas a desafios
│   ├── search/                    # Barras de busca, filtros, históricos e listas de recomendados
│   ├── settings/                  # Modais de alteração de senha, exclusão de conta e suporte
│   └── ui/                        # Componentes básicos do design system (botões, inputs, modal, etc.)
├── constants/                     # Configurações visuais estáticas (Design Tokens)
│   ├── theme.ts                   # Tokens de cores, fontes, tamanhos e espaçamentos do app
│   └── *Theme.ts                  # Estilos e temas específicos de cada funcionalidade/tela
├── context/                       # Contextos globais do React (estados compartilhados)
│   ├── ThemeContext.tsx           # Gerencia e persiste a escolha do tema (claro/escuro)
│   └── RecoveryFlowContext.tsx    # Mantém dados durante o fluxo de recuperação de senha
├── data/                          # Dados estáticos simulados (Mocks) para desenvolvimento local
│   └── feedMock.ts                # Mock de postagens para simular o app sem internet
├── docs/                          # Documentação arquitetural e de negócios do projeto
├── hooks/                         # Hooks React customizados para gerenciar lógica das telas
│   ├── use-color-scheme.ts        # Detecta se o celular do usuário está no tema claro/escuro
│   ├── use-theme-color.ts         # Retorna a cor exata com base no tema ativo (light/dark)
│   ├── useActionScreen.ts         # Lógica da câmera e gravação para evidências
│   ├── useClubDetailsScreen.ts    # Lógica de renderização de abas e detalhes do clube
│   ├── useFeedState.ts            # Gerenciamento de paginação e recarregamento do feed
│   ├── useNotificationsScreen.ts  # Gerenciamento de recebimento e leitura de notificações
│   ├── useRecoveryFlow.ts         # Controle das telas de alteração de senha
│   └── use*.ts                    # Hooks específicos para controle de cada tela (ex: useClubMembers)
├── scripts/                       # Scripts utilitários de automação
│   ├── reset-project.js           # Reseta as pastas de rota para o template inicial do Expo
│   └── update_mobile_env_ip.py    # Atualiza o IP no .env.local para testes no emulador físico
├── services/                      # Integração com APIs externas e armazenamento do dispositivo
│   ├── api.ts                     # Cliente HTTP base de comunicação com o backend do projeto
│   ├── cache.ts                   # Lógica geral de gravação e expiração de dados locais
│   ├── cachedApi.ts               # Chamadas à API envelopadas em cache para acesso offline
│   ├── clubsApi.ts                # Chamadas à API específicas do domínio de clubes
│   ├── mediaPicker.ts             # Integração nativa com a câmera e galeria do celular
│   ├── notificationsApi.ts        # Chamadas à API específicas do domínio de notificações
│   ├── settingsStorage.ts         # Persistência local de preferências do usuário (AsyncStorage)
│   └── uploads.ts                 # Envio direto de imagens e mídia para o Supabase Storage
├── types/                         # Tipagem TypeScript compartilhada por todo o projeto
│   ├── action.ts                  # Definições de tipo para fotos e câmera
│   ├── clubs.ts                   # Definições de tipo para clubes, membros e convites
│   ├── feed.ts                    # Definições de tipo para posts de verdades e desafios
│   └── ...                        # Tipagens para validação de formulários e APIs
└── __tests__/                     # Pasta contendo toda a suite de testes unitários e de integração (Jest)
```

## Telas principais

### 🔐 Autenticação

- **Login** - Autenticação com e-mail e senha
- **Signup** - Cadastro de novo usuário
- **Forgot Password** - Solicitação de recuperação
- **Verify Code** - Verificação de código por e-mail
- **Reset Password** - Redefinição de senha
- **Password Success** - Confirmação de sucesso

### 📰 Feed Principal

- **Feed** - Timeline de desafios e verdades
- **Proof Detail** - Visualização detalhada de resposta
- **Feed Comments** - Comentários em desafios

### 🎯 Ações

- **Action Screen** - Câmera para capturar evidência
- **Create Challenge** - Criar novo desafio/verdade
- **Media Picker** - Seleção de imagens/vídeos

### 👥 Clubes

- **Clubs Feed** - Feed específico do clube
- **Club Details** - Informações e mural do clube
- **Create Group** - Criar novo clube/grupo
- **Club Members** - Gerenciamento de membros

### 👤 Perfil

- **My Profile** - Perfil do usuário atual
- **Public Profile** - Perfil de outro usuário
- **Settings** - Configurações do app

### 🔍 Busca

- **Search** - Busca de usuários e clubes
- **Histórico** - Busca recentes

### 🔔 Notificações

- **Notifications** - Lista de notificações
- **Unread Counter** - Contador de não lidas

## Configuração para desenvolvimento

### Mock API

Durante desenvolvimento, algumas respostas podem vir de mock data em `data/`:

```typescript
// services/api.ts
export const api = {
  async getUser(id: string) {
    // Em desenvolvimento, pode retornar mock
    if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'development') {
      return mockUser;
    }
    return fetch(`${API_URL}/users/${id}`);
  }
};
```

### Tema e Design System

O app suporta light e dark mode automático:

```typescript
// context/ThemeContext.tsx
const theme = useColorScheme(); // 'light' | 'dark' | null

// constants/theme.ts
export const Colors = {
  light: { background: '#FFFFFF', ... },
  dark: { background: '#000000', ... }
};
```

### Cache com AsyncStorage

O app cacheia dados para offline:

```typescript
// services/cachedApi.ts
export const getCachedUser = async (id: string) => {
  const cached = await AsyncStorage.getItem(`user_${id}`);
  if (cached) return JSON.parse(cached);
  
  const fresh = await api.getUser(id);
  await AsyncStorage.setItem(`user_${id}`, JSON.stringify(fresh));
  return fresh;
};
```

## Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm test -- --watch

# Com cobertura
npm test -- --coverage
```

## Notas de desenvolvimento

### Organização por feature

O código segue uma estrutura **feature-based**:

- Cada feature (auth, feed, clubs) tem seus:
  - Componentes em `components/feature-name/`
  - Hooks em `hooks/useFeatureName.ts`
  - Serviços em `services/featureApi.ts` (se necessário)
  - Tipos em `types/feature.ts`

### File-based routing (Expo Router)

Arquivo de rota → URL da app:

```
app/feed.tsx              → /feed
app/clubs/[id].tsx        → /clubs/123
app/(tabs)/profile.tsx    → /profile (com tab)
app/login.tsx             → /login
```

### TypeScript Strict

- Sem `any` implícito
- Tipos explícitos em props e hooks
- Tipos para contextos

### Cache strategy

- **AsyncStorage**: Tokens, preferências, historico
- **Fetch cache**: Respostas HTTP com TTL
- **Image cache**: Expo Image gerencia automaticamente

### Navegação

- **Stack navigation**: Fluxos sequenciais (auth, recovery)
- **Tab navigation**: Abas principais (feed, clubs, search, profile)
- **Linking**: Deep linking com `expo-linking`

## Troubleshooting

### Erro: "Cannot find module 'expo'"

```bash
npm install
npx expo install --fix
```

### Emulador/Simulador não conecta

```bash
# Reiniciar Expo
npm run start:clear

# Ou usar tunnel
npm run start:tunnel
```

### Erro de dependência Expo

```bash
npx expo-doctor@latest
npm run fix-deps
```

### Cache corrompido

```bash
npm run reset-project
rm -rf node_modules
npm install
```

### Problema com AsyncStorage

```bash
# Limpar dados locais
adb shell pm clear com.pedrolabre.todan  # Android

# Ou manualmente no simulador/emulador
```

## Builds e Distribuição

### Preview (desenvolvimento)

```bash
npx expo start
# QR code para Expo Go (escaneie com o app)
```

### Build Android

```bash
eas build --platform android

# Ou local
npx react-native run-android
```

### Build iOS

```bash
eas build --platform ios

# Ou local (macOS)
npx react-native run-ios
```

### Build Web

```bash
npm run web
# ou
eas build --platform web
```

## Documentação recomendada

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript React Native](https://reactnative.dev/docs/typescript)

## Contribuindo

### Workflow

1. **Crie uma branch descritiva:**
   ```bash
   git checkout -b feature/nova-tela
   # ou
   git checkout -b fix/bug-correccao
   ```

2. **Implemente a feature**
   - Crie componentes em `components/feature-name/`
   - Hooks customizados em `hooks/`
   - Tipos em `types/`
   - Testes em `__tests__/`

3. **Teste em diferentes plataformas:**
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

4. **Execute linting e testes:**
   ```bash
   npm run lint
   npm test
   ```

5. **Commit e Push:**
   ```bash
   git commit -m "feat: descrição da mudança"
   git push origin feature/nova-tela
   ```

6. **Abra um Pull Request**

### Padrões de código

- **Componentes funcionais** com hooks
- **Types explícitos** para props
- **Temas centralizados** em `constants/`
- **Services abstraem API** (não chamar API direto em componentes)
- **Custom hooks** para lógica complexa

### Before submitting PR

- ✅ Testado em Android
- ✅ Testado em iOS
- ✅ Testado em Web
- ✅ `npm run lint` passa
- ✅ `npm test` passa
- ✅ Sem console errors/warnings
- ✅ TypeScript tipos corretos

## Licença

Este projeto é propriedade privada.
