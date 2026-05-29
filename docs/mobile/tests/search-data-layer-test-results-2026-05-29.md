## Arquivos testados

```text
mobile/types/search.ts
mobile/services/searchMappers.ts
mobile/services/api.ts
mobile/services/recentSearches.ts
mobile/__tests__/searchMappers.test.ts
mobile/__tests__/api.search.test.ts
mobile/__tests__/recentSearches.test.ts
```

## Escopo do relatorio

Regressao mobile da camada de dados de Busca, cobrindo mappers, cliente de API e persistencia local de buscas recentes de forma isolada do hook, da tela e dos componentes visuais.

Data da execucao: 29/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- TypeScript
- Expo lint

## Comandos executados

Comandos executados em `mobile/`:

```bash
npm test -- --runInBand __tests__/searchMappers.test.ts __tests__/api.search.test.ts __tests__/recentSearches.test.ts
npx tsc --noEmit
npm run lint
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/searchMappers.test.ts __tests__/api.search.test.ts __tests__/recentSearches.test.ts

PASS __tests__/searchMappers.test.ts
PASS __tests__/recentSearches.test.ts
PASS __tests__/api.search.test.ts

Test Suites: 3 passed, 3 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        5.168 s
Ran all test suites matching /__tests__\\searchMappers.test.ts|__tests__\\api.search.test.ts|__tests__\\recentSearches.test.ts/i.
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

## Cenarios validados

- Mapeamento de usuario com avatar, bio, username, level numerico e amigos em comum.
- Fallbacks de usuario sem avatar, sem bio, sem username e sem level.
- Remocao de `@` em username retornado pela API.
- Normalizacao de numeros invalidos, negativos e decimais antes de expor labels.
- Mapeamento de clube com imagem, icone, membros, tags e badge de alta.
- Fallbacks de clube sem imagem, sem icone, sem descricao e com tags invalidas.
- Busca unificada em `/search` com trim, encoding, token, `limit`, `AbortSignal` e mappers.
- Busca paginada de usuarios com `cursor`, `limit`, token, `AbortSignal` e `nextCursor`.
- Busca paginada de clubes com `cursor`, `limit`, token, `AbortSignal` e `nextCursor`.
- Omissao de cursor vazio e limit invalido na URL de usuarios.
- Busca de usuarios recomendados em `/search/recommended/users`.
- Busca de clubes em alta em `/search/trending/clubs`.
- Propagacao de erro por `parseResponse`.
- Bloqueio de chamada autenticada quando nao ha token salvo.
- Carregamento de historico vazio e historico existente de buscas recentes.
- Filtragem de registros invalidos salvos no storage local.
- Salvamento de novo item no topo do historico.
- Deduplicacao de item existente com movimentacao para o topo.
- Limite de 10 itens no historico, removendo o mais antigo.
- Remocao individual por `id`.
- Limpeza total do historico do usuario.
- Namespace por usuario para evitar vazamento entre contas.
- Falhas silenciosas de leitura, escrita, remocao e limpeza.
- Preservacao de `referenceId` ao salvar e carregar recentes.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que a camada mobile de dados de Busca esta coberta antes da integracao com o hook e a tela. Os testes validam a conversao dos DTOs, a montagem das chamadas autenticadas e o comportamento local do historico recente, incluindo deduplicacao, limite, remocao e limpeza total.

## Conclusao

A regressao mobile da camada de dados de Busca passou. Tipos, mappers, cliente de API e servico de recentes permanecem exercitados por testes isolados e sem dependencia da UI.
