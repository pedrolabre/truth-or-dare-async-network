## Arquivos testados

`mobile/__tests__/use-club-feed-test.tsx`

## Escopo do relatorio

Validacao automatizada do hook de feed interno do clube, cobrindo carregamento por aba ativa, marcacao de feed visto, ausencia de chamadas antes do acesso e tratamento silencioso de falha.

Data da execucao: 23/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library

## Comando executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-club-feed-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-feed-test.tsx

PASS __tests__/use-club-feed-test.tsx
  useClubFeed
    √ nao carrega feed enquanto a aba nao esta ativa (22 ms)
    √ carrega feed real quando a aba esta ativa e ha permissao (62 ms)
    √ marca feed visto apenas uma vez apos a aba/feed estar ativa (66 ms)
    √ falha ao marcar feed visto nao quebra renderizacao (55 ms)
    √ mostra estado vazio quando o endpoint retorna lista sem prompts (59 ms)
    √ mostra erro e retry recupera o feed sem paginacao falsa (61 ms)
    √ refresh preserva prompts ja carregados quando ocorre erro (60 ms)
    √ expoe loading inicial separado do detalhe do clube (8 ms)
    √ respeita permissions.canViewFeed e nao chama o endpoint sem permissao (5 ms)
    √ envia resposta de verdade com payload real e atualiza prompt local apos sucesso (67 ms)
    √ nao cria resposta local quando o endpoint de resposta falha (60 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        3.196 s
Ran all test suites matching /__tests__\\use-club-feed-test.tsx/i.
```

## Cenarios validados

- O feed nao carrega enquanto a aba nao esta ativa.
- O feed carrega pelo contrato real quando a aba esta ativa.
- A marcacao de visto ocorre uma vez apos o feed estar ativo.
- Refresh nao cria loop de marcacao de visto.
- Falha ao marcar visto nao bloqueia a renderizacao do feed.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. O hook marca o feed como visto em momento previsivel e preserva leitura do feed mesmo quando a marcacao falha.
