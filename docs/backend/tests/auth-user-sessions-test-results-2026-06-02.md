## Arquivos testados

```text
backend/src/services/auth/auth.service.ts
backend/src/controllers/auth/auth.controller.ts
backend/src/utils/jwt.ts
backend/src/middlewares/auth.middleware.ts
backend/src/services/users/sessions.service.ts
backend/tests/auth.test.ts
```

## Escopo do relatorio

Validacao backend do fluxo de login com registro de sessao de usuario,
incluindo compatibilidade do cadastro, autenticacao com senha, bloqueio de
usuario deletado, emissao de token e persistencia de dados de dispositivo,
plataforma e IP quando enviados.

Data da execucao: 02/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Prisma
- Jest
- Supertest
- ts-jest
- PostgreSQL

## Comandos executados

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/auth.test.ts
```

## Resultado da execucao

```text
> backend@1.0.0 test
> jest --runInBand tests/auth.test.ts

Applying migration `20260602180000_add_user_sessions`

PASS tests/auth.test.ts (6.559 s)
  Auth
    [ok] deve cadastrar um usuario com sucesso
    [ok] nao deve permitir cadastro com e-mail duplicado
    [ok] deve fazer login com sucesso
    [ok] deve registrar dados do dispositivo ao fazer login
    [ok] deve falhar no login com senha incorreta
    [ok] deve falhar no login quando o usuario nao existir
    [ok] deve falhar no login quando o usuario estiver deletado

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Time:        6.791 s
Ran all test suites matching /tests\\auth.test.ts/i.
```

## Cenarios validados

- Cadastro continua retornando usuario e token.
- Cadastro continua rejeitando e-mail duplicado.
- Login bem-sucedido continua retornando usuario e token.
- Login bem-sucedido cria uma sessao ativa vinculada ao usuario.
- Login aceita `deviceName` e `platform` no payload.
- Login registra IP recebido por `x-forwarded-for`.
- Login com senha incorreta continua rejeitado.
- Login de usuario inexistente continua rejeitado.
- Login de usuario com `deletedAt` preenchido continua rejeitado.

## Validacao manual

Nao houve chamada manual por Postman, Insomnia, navegador ou cliente mobile real.

## Interpretacao

A execucao confirma que o registro de sessao foi acoplado ao login sem quebrar
consumidores antigos e sem relaxar as validacoes existentes de autenticacao.

## Conclusao

A suite de autenticacao passou com 7 testes, incluindo cobertura de criacao de
sessao e persistencia de dados de dispositivo no login.
