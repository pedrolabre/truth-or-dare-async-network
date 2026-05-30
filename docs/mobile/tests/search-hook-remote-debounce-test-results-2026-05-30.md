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

Regressao mobile do hook da tela de Busca, cobrindo busca remota com debounce, cancelamento de requisicoes antigas, protecao contra resposta desatualizada, estados de resultado, retry, limpeza do termo, filtragem local por aba e preservacao da busca imediata ao tocar em item recente. A regressao complementar de API e recentes foi executada para garantir que os contratos consumidos pelo hook continuassem compativeis.

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

PASS __tests__/useSearchScreen.test.ts
  useSearchScreen
    √ carrega recomendados, clubes em alta e recentes ao montar (80 ms)
    √ resolve o usuario atual para carregar recentes quando o hook nao recebe userId (53 ms)
    √ mantem o hook utilizavel quando sugestoes ou recentes falham (4 ms)
    √ atualiza query imediatamente e dispara busca apos debounce de 350ms (75 ms)
    √ busca resultados remotos apos debounce e expoe estado de resultado vazio (6 ms)
    √ cancela requisicao antiga e impede resultado desatualizado de sobrescrever o atual (7 ms)
    √ salva resultado de usuario como recente com referenceId e atualiza memoria (2 ms)
    √ salva resultado de clube como recente e promove item existente (62 ms)
    √ remove e limpa recentes conectando storage e estado em memoria (67 ms)
    √ toca em busca recente, preenche query e dispara busca imediata (67 ms)
    √ expoe vazio, erro, retry e limpar campo de forma coerente (5 ms)
    √ expoe filtros, flags futuras e callbacks publicos do contrato (4 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        3.613 s, estimated 4 s
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
Time:        5.4 s
Ran all test suites matching /__tests__\\api.search.test.ts|__tests__\\recentSearches.test.ts/i.
```

## Cenarios validados

- Carregamento inicial de usuarios recomendados ao montar o hook.
- Carregamento inicial de clubes em alta ao montar o hook.
- Carregamento inicial de buscas recentes usando namespace por usuario.
- Manutencao do hook em estado utilizavel quando sugestoes, clubes em alta ou recentes falham.
- Atualizacao imediata de `query` ao digitar no campo.
- Debounce de 350ms antes de disparar a chamada remota de busca.
- Ausencia de chamada remota antes da pausa completa de digitacao.
- Busca remota com resultados de usuarios e clubes.
- Busca remota sem resultados expondo estado vazio.
- Cancelamento da requisicao anterior com `AbortController` ao emitir nova busca.
- Protecao contra resultado desatualizado sobrescrever o estado atual.
- Estado de erro disponivel quando a busca falha.
- Retry repetindo a busca do termo atual.
- Limpeza do campo removendo termo, resultados e erro.
- Retorno ao estado inicial quando `query.trim()` fica vazio.
- Filtragem local por `activeFilter` usando resultados ja carregados.
- Troca de filtro sem nova chamada remota.
- `isLoading` representando a busca remota ativa do termo.
- Preservacao de `isLoadingMore`, `hasMoreUsers` e `hasMoreClubs` como flags futuras sem paginacao neste escopo.
- Toque em busca recente preenchendo `query` com o `label`.
- Busca imediata ao tocar em item recente sem aguardar debounce.
- Prevencao de chamada duplicada apos busca imediata por item recente.
- Salvamento de resultado de usuario como busca recente com `referenceId`.
- Salvamento de resultado de clube como busca recente com `referenceId`.
- Remocao individual e limpeza total de buscas recentes.
- Regressao do client de API de busca para chamadas autenticadas, endpoints de descoberta e mappers.
- Regressao do servico local de recentes para deduplicacao, limite, remocao, limpeza, falhas silenciosas e preservacao de `referenceId`.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que o hook da Busca dispara chamadas remotas somente apos a pausa de digitacao, cancela buscas antigas ao receber um novo termo e ignora respostas desatualizadas. A troca de aba permanece local sobre os dados ja carregados, e o fluxo de busca recente continua imediato sem criar uma chamada duplicada por debounce.

## Conclusao

A regressao mobile do hook de Busca passou. O comportamento de debounce, cancelamento, retry, vazio, erro, filtragem local e busca imediata por recente ficou coberto por teste automatizado, com TypeScript e lint validando o mobile sem erros.
