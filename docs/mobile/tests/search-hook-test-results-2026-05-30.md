## Arquivos testados

```text
mobile/hooks/useSearchScreen.ts
mobile/__tests__/useSearchScreen.test.ts
```

## Arquivos existentes executados como regressao

```text
mobile/services/api.ts
mobile/services/recentSearches.ts
mobile/__tests__/api.search.test.ts
mobile/__tests__/recentSearches.test.ts
```

## Escopo do relatorio

Regressao mobile do hook da tela de Busca, cobrindo estado inicial, recentes, debounce, busca remota paginada, cancelamento, retry, erro, resultado vazio, filtros locais, paginacao de usuarios e clubes, cursores, `isLoadingMore` independente de `isLoading` e limpeza de paginacao pendente.

Data da execucao: 30/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- React Native Testing Library
- jest-expo
- TypeScript
- Expo lint

## Comandos executados

Comandos executados em `mobile/`:

```bash
npm test -- --runInBand __tests__/useSearchScreen.test.ts
npx tsc --noEmit
npm run lint
npm test -- --runInBand __tests__/api.search.test.ts __tests__/recentSearches.test.ts
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/useSearchScreen.test.ts

PASS __tests__/useSearchScreen.test.ts (8.216 s)
  useSearchScreen
    √ carrega recomendados, clubes em alta e recentes ao montar (165 ms)
    √ resolve o usuario atual para carregar recentes quando o hook nao recebe userId (78 ms)
    √ mantem o hook utilizavel quando sugestoes ou recentes falham (17 ms)
    √ atualiza query imediatamente e dispara busca apos debounce de 350ms (88 ms)
    √ busca resultados remotos apos debounce e expoe estado de resultado vazio (32 ms)
    √ cancela requisicao antiga e impede resultado desatualizado de sobrescrever o atual (19 ms)
    √ salva resultado de usuario como recente com referenceId e atualiza memoria (9 ms)
    √ salva resultado de clube como recente e promove item existente (69 ms)
    √ remove e limpa recentes conectando storage e estado em memoria (63 ms)
    √ toca em busca recente, preenche query e dispara busca imediata (65 ms)
    √ expoe vazio, erro, retry e limpar campo de forma coerente (14 ms)
    √ expoe filtros, flags de paginacao e callbacks publicos do contrato (15 ms)
    √ pagina usuarios com cursor, concatena resultados e mantem loading separado (12 ms)
    √ pagina clubes com cursor e respeita o filtro ativo (10 ms)
    √ limpa query cancelando paginacao pendente, resultados e cursores (9 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        8.865 s
Ran all test suites matching /__tests__\\useSearchScreen.test.ts/i.
```

```text
npx tsc --noEmit
```

Resultado: validacao TypeScript concluida sem erros.

```text
> mobile@1.0.0 lint
> expo lint

env: load .env.local
env: export EXPO_PUBLIC_API_URL
```

Resultado: lint concluido sem erros.

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/api.search.test.ts __tests__/recentSearches.test.ts

PASS __tests__/recentSearches.test.ts
PASS __tests__/api.search.test.ts

Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        6.359 s
Ran all test suites matching /__tests__\\api.search.test.ts|__tests__\\recentSearches.test.ts/i.
```

## Cenarios validados

- Carregamento inicial de usuarios recomendados, clubes em alta e recentes.
- Resolucao do usuario atual para namespace local de recentes.
- Manutencao do hook em estado utilizavel quando sugestoes ou recentes falham.
- Atualizacao imediata de `query`.
- Debounce de 350ms antes da busca remota.
- Busca remota com resultado.
- Busca remota sem resultado.
- Estado de erro e retry do termo atual.
- Cancelamento de requisicao antiga com `AbortController`.
- Protecao contra resultado desatualizado sobrescrever o estado atual.
- Troca de filtro local sem nova busca remota.
- Salvamento de resultado de usuario como recente.
- Salvamento de resultado de clube como recente e promocao de item existente.
- Toque em busca recente com preenchimento de `query` e busca imediata sem debounce duplicado.
- Remocao individual e limpeza total de recentes.
- Paginacao de usuarios com cursor retornado pela API.
- Paginacao de clubes com cursor retornado pela API.
- `hasMoreUsers` baseado no `nextCursor` de usuarios.
- `hasMoreClubs` baseado no `nextCursor` de clubes.
- `isLoadingMore` ativo apenas durante paginacao e independente de `isLoading`.
- Paginacao sem disparar nova busca inicial do outro tipo.
- Concatenacao dos resultados paginados preservando itens ja carregados.
- Paginacao respeitando o termo atual e o filtro ativo.
- `clearQuery` cancelando paginacao pendente, limpando resultados, cursores, erro e termo.
- Regressao do client de API de busca para endpoints paginados, descoberta e mappers.
- Regressao do servico local de recentes para deduplicacao, limite, remocao, limpeza, falhas silenciosas e preservacao de `referenceId`.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que o hook da Busca centraliza o comportamento de estado inicial, busca remota, debounce, cancelamento, filtro local, recentes e paginacao. As chamadas de pagina adicional usam o termo atual, preservam os resultados carregados e atualizam os cursores conforme o `nextCursor` retornado pelos endpoints paginados.

## Conclusao

A regressao mobile do hook de Busca passou. O comportamento final do hook ficou coberto por teste automatizado, com TypeScript, lint e regressoes de API/recentes validando o mobile sem erros.
