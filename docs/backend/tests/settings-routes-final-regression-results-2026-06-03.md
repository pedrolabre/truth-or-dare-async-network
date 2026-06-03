## Arquivos testados

```text
backend/src/controllers/auth/auth.controller.ts
backend/src/controllers/users/users.controller.ts
backend/src/services/auth/auth.service.ts
backend/src/services/auth/settings.metrics.ts
backend/src/services/auth/settings.observability.ts
backend/src/services/users/users.service.ts
backend/tests/settings.routes.test.ts
```

## Escopo do relatorio

Validacao backend final dos endpoints autenticados de Configuracoes, cobrindo
perfil autenticado, atualizacao parcial de conta, troca de e-mail, troca de
senha, exclusao de conta, autorizacao obrigatoria e regressao dos cenarios de
usuario ja deletado.

Data da execucao: 03/06/2026.

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

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/settings.routes.test.ts
```

## Resultado da execucao

```text
PASS tests/settings.routes.test.ts
  settings.routes
    [ok] GET /users/me retorna contrato expandido sem remover campos existentes
    [ok] PUT /users/me continua disponivel para consumidores existentes
    [ok] GET /users/me exige token valido
    [ok] PATCH /users/me atualiza somente campos enviados e e idempotente
    [ok] PATCH /users/me rejeita campo invalido com codigo especifico
    [ok] PATCH /users/me exige token valido
    [ok] DELETE /users/me marca deletedAt sem apagar fisicamente o usuario
    [ok] DELETE /users/me rejeita payload sem senha atual
    [ok] DELETE /users/me rejeita senha atual incorreta
    [ok] DELETE /users/me retorna USER_NOT_FOUND quando usuario ja foi deletado
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
Tests:       26 passed, 26 total
Time:        20.943 s
```

## Cenarios validados

- `GET /users/me` retorna dados autenticados e exige token valido.
- `PATCH /users/me` aplica atualizacao parcial, idempotente e autenticada.
- `POST /auth/change-email` normaliza e persiste e-mail novo com senha atual.
- `POST /auth/change-password` atualiza hash de senha com senha atual valida.
- Endpoints sensiveis rejeitam requisicoes sem token.
- `DELETE /users/me` cobre sucesso, senha ausente, senha incorreta, usuario ja
  deletado e ausencia de token.
- Tokens validos para usuarios inexistentes retornam `USER_NOT_FOUND`.
- As alteracoes bem-sucedidas de e-mail e senha emitem log estruturado de
  observabilidade durante a suite.

## Validacoes adicionais

Build backend executado em `backend/`:

```bash
npm run build
```

Resultado:

```text
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma
Comando concluido sem erros.
```

## Interpretacao

A regressao confirma que os endpoints de Configuracoes preservam as regras de
negocio existentes e exigem autenticacao nos fluxos sensiveis. A cobertura de
exclusao agora tambem valida o caso de conta ja marcada como deletada.

## Conclusao

A suite passou com 26 testes. O build backend final tambem concluiu sem erros.
