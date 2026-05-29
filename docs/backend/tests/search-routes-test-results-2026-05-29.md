## Arquivo testado

`backend/tests/search.routes.test.ts`

## Escopo do relatorio

Validacao das rotas REST autenticadas de busca para usuarios, clubes e busca unificada, incluindo contrato HTTP, paginacao, autorizacao, filtros de clubes e traducao de erros padronizados.

Data da execucao: 29/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- ts-jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/search.routes.test.ts
```

Resultado:

```text
PASS tests/search.routes.test.ts
  search.routes
    [ok] exige autenticacao nos endpoints de busca
    [ok] retorna erro padronizado para query curta
    [ok] retorna erro padronizado para query longa
    [ok] GET /search/users retorna usuarios com contrato publico
    [ok] GET /search/users retorna lista vazia sem resultados
    [ok] GET /search/users pagina por cursor
    [ok] GET /search/clubs retorna clubes com contrato publico
    [ok] GET /search/clubs retorna lista vazia sem resultados
    [ok] GET /search/clubs pagina por cursor
    [ok] GET /search/clubs aplica filtros de visibilidade e status
    [ok] GET /search retorna payload unificado com paginacao por categoria
    [ok] traduz erro do servico para resposta HTTP padronizada

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
```

Observacao: a execucao resetou o banco de teste e aplicou as migrations disponiveis antes da suite.

## Validacoes adicionais

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/search.service.test.ts
```

Resultado:

- Suite `tests/search.service.test.ts` validada com sucesso.
- 9 testes passaram.

Comando executado em `backend/`:

```text
npx tsc --noEmit
```

Resultado:

- TypeScript backend validado com sucesso.

## Cenarios validados

- `GET /search/users` exige token de autenticacao.
- `GET /search/clubs` exige token de autenticacao.
- `GET /search` exige token de autenticacao.
- Query curta retorna erro HTTP com `SEARCH_QUERY_TOO_SHORT`.
- Query longa retorna erro HTTP com `SEARCH_QUERY_TOO_LONG`.
- Busca de usuarios retorna `items` e `nextCursor`.
- Busca de usuarios retorna somente campos publicos esperados.
- Busca de usuarios sem resultado retorna lista vazia e `nextCursor` nulo.
- Busca de usuarios pagina por cursor.
- Busca de clubes retorna `items` e `nextCursor`.
- Busca de clubes retorna campos publicos esperados.
- Busca de clubes sem resultado retorna lista vazia e `nextCursor` nulo.
- Busca de clubes pagina por cursor.
- Clubes privados nao aparecem nos resultados.
- Clubes arquivados nao aparecem nos resultados.
- Clubes bloqueados para o viewer nao aparecem nos resultados.
- Busca unificada retorna usuarios e clubes com paginacao separada por categoria.
- Falha de persistencia no servico e traduzida para `SEARCH_UNAVAILABLE`.

## Interpretacao

As rotas autenticadas de busca preservam as regras de dominio no servico e mantem o controller restrito a leitura de parametros HTTP, chamada do servico e traducao de erros. O contrato de paginacao segue o envelope `{ items, nextCursor }`, inclusive dentro da busca unificada para manter paginacao independente por categoria.

## Conclusao

A suite focada passou e valida o contrato HTTP de busca autenticada para usuarios, clubes e busca unificada, incluindo autorizacao, erros padronizados, filtros de clubes, paginacao e regressao do servico existente.
