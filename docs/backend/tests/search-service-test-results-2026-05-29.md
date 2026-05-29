## Arquivo testado

`backend/tests/search.service.test.ts`

## Escopo do relatorio

Validacao do servico backend de busca para usuarios e clubes, incluindo contratos publicos, paginacao, filtros de dominio, erros padronizados, `mutualCount` e `isTrending`.

Data da execucao: 29/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- ts-jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/search.service.test.ts
```

Resultado:

```text
PASS tests/search.service.test.ts
  search.service
    [ok] rejeita busca vazia ou curta com erro padronizado (587 ms)
    [ok] rejeita busca longa com erro padronizado (177 ms)
    [ok] busca usuarios por nome, username e bio retornando somente campos publicos (452 ms)
    [ok] retorna lista vazia quando nao ha resultados (107 ms)
    [ok] pagina resultados por cursor e offset (382 ms)
    [ok] filtra clubes por visibilidade, status publico e bloqueio do viewer (438 ms)
    [ok] calcula mutualCount por clubes ativos em comum no schema atual (394 ms)
    [ok] calcula isTrending por crescimento de membros nas ultimas 48 horas (492 ms)
    [ok] traduz falhas de persistencia para SEARCH_UNAVAILABLE (86 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        6.75 s
Ran all test suites matching /tests\\search.service.test.ts/i.
```

Observacao: a execucao resetou o banco de teste e aplicou as migrations disponiveis antes da suite.

## Validacao adicional

Comando executado em `backend/`:

```text
npx tsc --noEmit
```

Resultado:

- TypeScript backend validado com sucesso.

## Cenarios validados

- Busca vazia ou curta retorna `SEARCH_QUERY_TOO_SHORT`.
- Busca longa retorna `SEARCH_QUERY_TOO_LONG`.
- Busca de usuarios encontra registros por `name`.
- Busca de usuarios encontra registros por `username`.
- Busca de usuarios encontra registros por `bio`.
- Resultado de usuarios nao expoe `email` nem `passwordHash`.
- Busca sem resultados retorna lista vazia e `nextCursor` nulo.
- Paginacao de usuarios funciona por cursor.
- Paginacao de usuarios funciona por offset.
- Busca de clubes encontra registros por termo textual e tags.
- Clubes privados nao aparecem nos resultados.
- Clubes arquivados nao aparecem nos resultados.
- Clubes bloqueados para o viewer nao aparecem nos resultados.
- `mutualCount` e calculado por clubes ativos em comum.
- `isTrending` e calculado por crescimento de membros ativos nas ultimas 48 horas.
- Falhas de persistencia sao traduzidas para `SEARCH_UNAVAILABLE`.

## Interpretacao

A suite confirma que as regras de busca permanecem concentradas no service e que o retorno evita campos privados. O servico tambem preserva filtros de dominio para clubes publicos, ativos e disponiveis ao viewer.

Como o schema atual nao possui relacoes de amizade ou seguidores, `mutualCount` usa clubes ativos em comum como melhor aproximacao segura. Como o schema atual de `User` nao possui `avatarUrl`, `level` ou status de desativacao, esses campos ainda nao permitem calculo ou filtragem especifica no servico.

## Validacao manual

Nao houve validacao manual no app mobile, navegador, Prisma Studio ou cliente HTTP.

## Conclusao

A suite focada passou e valida o servico backend de busca para usuarios e clubes, incluindo paginacao, filtros de dominio, erros padronizados e calculos derivados com os dados disponiveis no schema atual.
