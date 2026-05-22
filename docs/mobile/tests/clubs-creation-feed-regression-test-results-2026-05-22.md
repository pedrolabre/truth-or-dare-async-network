## Arquivos testados

- `mobile/__tests__/use-clubs-screen-test.tsx`
- `mobile/__tests__/clubs-screen-test.tsx`
- `mobile/__tests__/use-create-group-screen-test.tsx`
- `mobile/__tests__/create-group-screen-test.tsx`
- `mobile/__tests__/use-club-feed-test.tsx`

## Escopo do relatorio

Validacao automatizada de regressao dos fluxos de Clubes, Criacao de clube e Feed interno do clube apos a integracao de comentarios indisponiveis, membros reais e cobertura final de navegacao.

Data da execucao: 22/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library
- React Test Renderer

## Comando executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-clubs-screen-test.tsx __tests__/clubs-screen-test.tsx __tests__/use-create-group-screen-test.tsx __tests__/create-group-screen-test.tsx __tests__/use-club-feed-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-clubs-screen-test.tsx __tests__/clubs-screen-test.tsx __tests__/use-create-group-screen-test.tsx __tests__/create-group-screen-test.tsx __tests__/use-club-feed-test.tsx

PASS __tests__/use-clubs-screen-test.tsx (5.026 s)
PASS __tests__/clubs-screen-test.tsx
PASS __tests__/use-create-group-screen-test.tsx
PASS __tests__/create-group-screen-test.tsx
PASS __tests__/use-club-feed-test.tsx

Test Suites: 5 passed, 5 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        11.014 s, estimated 12 s
Ran all test suites matching /__tests__\\use-clubs-screen-test.tsx|__tests__\\clubs-screen-test.tsx|__tests__\\use-create-group-screen-test.tsx|__tests__\\create-group-screen-test.tsx|__tests__\\use-club-feed-test.tsx/i.
```

## Suites executadas

- `use-clubs-screen-test.tsx`: estados e acoes do hook da tela de Clubes.
- `clubs-screen-test.tsx`: renderizacao e navegacao da tela de Clubes.
- `use-create-group-screen-test.tsx`: validacao e submit do hook de criacao de clube.
- `create-group-screen-test.tsx`: renderizacao, feedback e navegacao da tela de criacao.
- `use-club-feed-test.tsx`: carregamento e acoes do feed interno do clube.

## Cenarios validados

- Tela de Clubes preserva carregamento inicial.
- Tela de Clubes preserva estados vazio e erro.
- Descoberta de clubes continua carregando dados reais quando acionada.
- Busca de clubes continua usando debounce e consulta remota.
- Entrada em clube continua atualizando contadores e Meus Clubes.
- Cards de Meus Clubes continuam navegando para `/clubs/{id}`.
- Cards de Descobrir continuam navegando para `/clubs/{id}`.
- Resultados de busca continuam navegando para `/clubs/{id}`.
- Acao Entrar em clube continua independente da navegacao do card.
- Criacao de clube preserva validacao de nome.
- Criacao de clube preserva validacao de descricao.
- Criacao de clube preserva privacidade, regras e tags.
- Criacao de clube preserva busca remota de membros.
- Criacao de clube preserva submit real para `createClub`.
- Criacao de clube preserva feedback de erro e retry.
- Criacao de clube preserva feedback de sucesso.
- Criacao de clube navega para `/clubs/{id}` com id retornado pela API.
- Criacao de clube publica upsert local em Meus Clubes.
- Feed interno preserva carregamento condicionado a aba ativa.
- Feed interno preserva respeito a `permissions.canViewFeed`.
- Feed interno preserva estados de sucesso, vazio, erro, retry e refresh.
- Feed interno preserva ausencia de paginacao falsa de prompts.
- Resposta de prompt preserva envio real e merge local apos sucesso.
- Falha de resposta de prompt nao cria resposta local.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A regressao automatizada passou. Os fluxos de Clubes, Criacao e Feed interno continuam funcionando apos as alteracoes de comentarios, membros e navegacao final.
