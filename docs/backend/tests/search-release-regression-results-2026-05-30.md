## Arquivos testados

```text
backend/src/controllers/search/search.controller.ts
backend/src/routes/search/search.routes.ts
backend/src/services/search/search.service.ts
backend/src/services/search/types.ts
backend/src/services/search/validators.ts
backend/tests/search.service.test.ts
backend/tests/search.routes.test.ts
```

## Escopo do relatorio

Regressao backend dos endpoints e servico de Busca antes do fechamento de release, cobrindo usuarios, clubes, conteudo, filtros avancados, autorizacao, paginacao e exclusoes de dados privados, removidos ou indisponiveis.

Data da execucao: 2026-05-30.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Prisma
- TypeScript

## Comandos executados

Comandos executados em `backend/`:

```bash
npm test -- --runInBand tests/search.service.test.ts tests/search.routes.test.ts
npx tsc --noEmit
```

## Resultado da execucao

Saida do terminal:

```text
> backend@1.0.0 test
> jest --runInBand tests/search.service.test.ts tests/search.routes.test.ts

PASS tests/search.routes.test.ts (9.159 s)
PASS tests/search.service.test.ts (6.644 s)

Test Suites: 2 passed, 2 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        16.112 s, estimated 21 s
Ran all test suites matching /tests\\search.service.test.ts|tests\\search.routes.test.ts/i.
```

```text
npx tsc --noEmit
```

Resultado: validacao TypeScript concluida sem erros.

## Cenarios validados

- Busca de usuarios com resultados e sem resultados.
- Busca de clubes com resultados e sem resultados.
- Busca unificada com usuarios, clubes e conteudo.
- Busca de conteudo em dados permitidos.
- Exclusao de conteudo privado, removido, expirado ou indisponivel.
- Filtros avancados de usuarios e clubes.
- Paginacao por cursor.
- Autorizacao dos endpoints de busca.
- Sugestoes de usuarios recomendados.
- Clubes em alta.
- Erros padronizados de busca.

## Interpretacao

A regressao confirma que o backend preserva o contrato consumido pelo mobile para usuarios, clubes e conteudo, incluindo filtros avancados e regras de visibilidade.

## Conclusao

A regressao backend de Busca passou. Os endpoints e o servico seguem compativeis com a tela mobile e com os blocos anteriores de filtros avancados e busca de conteudo.
