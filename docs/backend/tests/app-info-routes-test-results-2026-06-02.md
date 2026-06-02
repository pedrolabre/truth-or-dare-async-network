## Arquivos testados

```text
backend/package.json
backend/src/app.ts
backend/src/controllers/app-info/app-info.controller.ts
backend/src/routes/app-info/app-info.routes.ts
backend/src/services/app-info/app-info.service.ts
backend/tests/app-info.routes.test.ts
```

## Escopo do relatorio

Validacao backend do endpoint publico de informacoes da aplicacao, cobrindo
`GET /app-info`, status operacional, ambiente, versao configurada da API e
fallback para a versao declarada no `package.json`.

Data da execucao: 02/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- ts-jest
- Prisma
- PostgreSQL
- TypeScript

## Comandos executados

Comandos executados em `backend/`:

```bash
npm test -- --runInBand tests/app-info.routes.test.ts
npm run build
```

## Resultado da execucao

Suite dedicada de informacoes da aplicacao:

```text
> backend@1.0.0 test
> jest --runInBand tests/app-info.routes.test.ts

PASS tests/app-info.routes.test.ts (13.353 s)
  app-info.routes
    [ok] GET /app-info retorna status, ambiente e versao configurada da API sem token
    [ok] GET /app-info usa a versao do package.json quando API_VERSION nao foi definida

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        13.729 s
Ran all test suites matching /tests\\app-info.routes.test.ts/i.
```

Build backend:

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma
```

Resultado: build concluido com exit code 0.

## Cenarios validados

- `GET /app-info` responde sem token de autenticacao.
- O endpoint retorna `status: ok`.
- O endpoint retorna o ambiente atual da API.
- O endpoint retorna a versao definida por `API_VERSION` quando configurada.
- O endpoint usa a versao `1.0.0` do `package.json` quando `API_VERSION` nao foi definida.
- O build backend conclui sem erros de TypeScript.

## Validacao manual

Nao houve chamada manual por Postman, Insomnia, navegador ou cliente mobile real.

## Interpretacao

A execucao confirma que o endpoint publico fornece informacoes reais da API sem
depender de autenticacao. O fallback de versao garante resposta estavel mesmo
quando a variavel `API_VERSION` nao existe no ambiente.

## Conclusao

A suite dedicada de informacoes da aplicacao passou com 2 testes. O build
backend tambem foi concluido com sucesso.
