## Arquivos testados

```text
mobile/services/api.ts
mobile/services/searchMappers.ts
mobile/types/search.ts
mobile/__tests__/api.search.test.ts
```

## Escopo do relatorio

Regressao mobile do client de busca apos ampliacao do modulo compartilhado de
API, cobrindo URLs, token autenticado, filtros, paginacao, AbortSignal,
mapeadores, descoberta, perfil publico e propagacao de erros.

Data da execucao: 01/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- @react-native-async-storage/async-storage

## Comandos executados

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/api.search.test.ts
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/api.search.test.ts

PASS __tests__/api.search.test.ts (7.558 s)
  search API client
    √ busca resultados unificados com URL segura, token, limit, AbortSignal e mappers (345 ms)
    √ busca usuarios com cursor, limit, token, AbortSignal e preserva nextCursor (7 ms)
    √ omite cursor vazio e limit invalido ao montar URL de usuarios (13 ms)
    √ envia filtros avancados na URL de busca (17 ms)
    √ busca clubes com cursor, limit, token, AbortSignal e preserva nextCursor (5 ms)
    √ busca conteudo com cursor, limit, token, AbortSignal e preserva nextCursor (5 ms)
    √ busca usuarios recomendados no endpoint de descoberta e aplica mapper (4 ms)
    √ busca clubes em alta no endpoint de descoberta e aplica mapper (3 ms)
    √ busca perfil publico de usuario sem exigir token (8 ms)
    √ reaproveita parseResponse para propagar erro da API de busca (96 ms)
    √ interrompe chamadas autenticadas quando nao ha token salvo (2 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        8.179 s
Ran all test suites matching /__tests__\\api.search.test.ts/i.
```

## Cenarios validados

- Busca unificada com query normalizada, limite, token, AbortSignal e mappers.
- Busca paginada de usuarios, clubes e conteudo.
- Omissao de cursor vazio e limite invalido.
- Filtros avancados na URL autenticada.
- Descoberta de usuarios recomendados e clubes em alta.
- Perfil publico sem exigencia de token.
- Propagacao de erro via `parseResponse()`.
- Bloqueio de busca autenticada quando nao existe token salvo.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A regressao confirma que a ampliacao do modulo compartilhado `api.ts` preserva
os contratos existentes de busca, descoberta e perfil publico.

## Conclusao

A suite de regressao passou com 11 testes. O client de busca permaneceu
compativel apos a ampliacao do modulo compartilhado de API.
