## Arquivo testado

- `mobile/__tests__/use-club-feed-test.tsx`

## Escopo do relatorio

Validacao automatizada do hook de feed interno do clube, incluindo carregamento do feed e resposta rapida de prompt de verdade.

Data da execucao: 22/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library

## Comando de teste executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-club-feed-test.tsx
```

## Resultado do teste

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-feed-test.tsx

PASS __tests__/use-club-feed-test.tsx
  useClubFeed
    √ nao carrega feed enquanto a aba nao esta ativa (33 ms)
    √ carrega feed real quando a aba esta ativa e ha permissao (78 ms)
    √ mostra estado vazio quando o endpoint retorna lista sem prompts (56 ms)
    √ mostra erro e retry recupera o feed sem paginacao falsa (69 ms)
    √ refresh preserva prompts ja carregados quando ocorre erro (59 ms)
    √ expoe loading inicial separado do detalhe do clube (5 ms)
    √ respeita permissions.canViewFeed e nao chama o endpoint sem permissao (12 ms)
    √ envia resposta de verdade com payload real e atualiza prompt local apos sucesso (77 ms)
    √ nao cria resposta local quando o endpoint de resposta falha (76 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        4.851 s
Ran all test suites matching /__tests__\\use-club-feed-test.tsx/i.
```

## Cenarios validados

- O hook nao chama o feed enquanto a aba Feed nao esta ativa.
- O hook carrega o feed quando a aba Feed esta ativa e `permissions.canViewFeed` permite.
- O hook trata lista vazia, erro, retry e refresh.
- O refresh preserva prompts ja carregados quando uma nova consulta falha.
- Usuario sem permissao recebe estado de feed indisponivel sem chamada ao endpoint.
- A resposta de verdade envia payload real para a funcao de resposta.
- Apos sucesso de resposta, o prompt local atualiza `answeredByMe`, `canAnswer`, `answersCount` e `recentResponses`.
- Quando a resposta falha, nenhuma resposta local e criada.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A suite passou. O hook de feed preserva o comportamento de carregamento do feed e atualiza o prompt local somente apos sucesso real da resposta de verdade.
