## Arquivos testados

```text
backend/prisma/schema.prisma
backend/prisma/migrations/20260602100000_add_user_deleted_at/migration.sql
backend/src/generated/prisma
backend/src/services/users/settings.errors.ts
backend/src/services/users/settings.validators.ts
backend/src/services/users/users.service.ts
backend/src/controllers/users/users.controller.ts
backend/src/routes/users/users.routes.ts
backend/src/services/auth/auth.service.ts
backend/tests/settings.routes.test.ts
backend/tests/auth.test.ts
```

## Escopo do relatorio

Validacao backend da exclusao autenticada de conta por soft delete, cobrindo
campo `deletedAt`, migration, `DELETE /users/me`, senha atual obrigatoria,
senha incorreta, autorizacao e bloqueio de login para usuario deletado.

Data da execucao: 02/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- npx
- Jest
- Supertest
- ts-jest
- Prisma
- PostgreSQL
- TypeScript

## Comandos executados

Comandos executados em `backend/`:

```bash
npx prisma validate
npm test -- --runInBand tests/settings.routes.test.ts
npx prisma generate
npm test -- --runInBand tests/settings.routes.test.ts
npm test -- --runInBand tests/auth.test.ts
npm run build
npm test -- --runInBand tests/settings.routes.test.ts
npm test -- --runInBand tests/auth.test.ts
npm run build
```

## Resultado da execucao

Validacao do schema Prisma:

```text
The schema at prisma\schema.prisma is valid
```

Primeira execucao de `settings.routes`:

```text
FAIL tests/settings.routes.test.ts
TS2353: Object literal may only specify known properties, and 'deletedAt'
does not exist in type 'UserSelect<DefaultArgs>'.
TS2339: Property 'deletedAt' does not exist on type User.
```

Interpretacao da falha inicial: a migration nova foi aplicada no banco de
teste, mas o Prisma Client gerado ainda nao continha o campo `deletedAt`.

Correcao aplicada:

```text
npx prisma generate
Generated Prisma Client (7.6.0) to .\src\generated\prisma
```

Execucao final de `settings.routes`:

```text
PASS tests/settings.routes.test.ts (33.577 s)
  settings.routes
    [ok] GET /users/me retorna contrato expandido sem remover campos existentes
    [ok] PUT /users/me continua disponivel para consumidores existentes
    [ok] PATCH /users/me atualiza somente campos enviados e e idempotente
    [ok] PATCH /users/me rejeita campo invalido com codigo especifico
    [ok] PATCH /users/me exige token valido
    [ok] DELETE /users/me marca deletedAt sem apagar fisicamente o usuario
    [ok] DELETE /users/me rejeita payload sem senha atual
    [ok] DELETE /users/me rejeita senha atual incorreta
    [ok] DELETE /users/me exige token valido
    [ok] POST /auth/change-email altera e normaliza o e-mail
    [ok] POST /auth/change-email rejeita e-mail invalido
    [ok] POST /auth/change-email rejeita e-mail em uso
    [ok] POST /auth/change-email rejeita senha atual incorreta
    [ok] POST /auth/change-email exige token valido
    [ok] POST /auth/change-password altera a senha
    [ok] POST /auth/change-password rejeita senha atual incorreta
    [ok] POST /auth/change-password rejeita senha nova fraca
    [ok] POST /auth/change-password rejeita senha nova igual a atual
    [ok] POST /auth/change-password exige token valido
    [ok] retorna USER_NOT_FOUND quando o token aponta para usuario inexistente

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
```

Execucao de `auth.test.ts`:

```text
PASS tests/auth.test.ts (12.768 s)
  Auth
    [ok] deve cadastrar um usuario com sucesso
    [ok] nao deve permitir cadastro com e-mail duplicado
    [ok] deve fazer login com sucesso
    [ok] deve falhar no login com senha incorreta
    [ok] deve falhar no login quando o usuario nao existir
    [ok] deve falhar no login quando o usuario estiver deletado

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

Reexecucao final: apos reforcar a protecao de endpoints autenticados para
usuarios com `deletedAt` preenchido, `settings.routes.test.ts`, `auth.test.ts`
e `npm run build` foram executados novamente e passaram com exit code 0.

Build backend:

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma
```

Resultado: build concluido com exit code 0.

## Cenarios validados

- `DELETE /users/me` exige token valido.
- `DELETE /users/me` exige senha atual.
- Senha atual incorreta retorna `INVALID_CURRENT_PASSWORD`.
- Exclusao com senha correta marca `deletedAt`.
- A conta permanece fisicamente no banco apos a exclusao.
- A migration cria o campo `deletedAt` no modelo `User`.
- Login com usuario marcado com `deletedAt` retorna erro generico de credenciais.
- Endpoints autenticados de conta tratam usuario deletado como inexistente.
- Fluxos existentes de e-mail e senha continuaram passando na suite de regressao.

## Validacao manual

Nao houve chamada manual por Postman, Insomnia, navegador ou cliente mobile real.

## Interpretacao

A execucao confirma que a exclusao de conta usa soft delete e preserva a
integridade referencial. A autenticacao nao aceita usuarios com `deletedAt`
preenchido, mesmo quando e-mail e senha estao corretos.

A falha inicial foi restrita ao Prisma Client desatualizado apos mudanca de
schema. A geracao do client corrigiu os tipos e a execucao final passou.

## Conclusao

As suites backend de configuracoes e autenticacao passaram com 30 testes no
total. O schema Prisma foi validado e o build backend foi concluido com
sucesso.
