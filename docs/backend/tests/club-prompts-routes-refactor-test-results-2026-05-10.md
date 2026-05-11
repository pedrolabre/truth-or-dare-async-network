## Arquivo testado

`backend/tests/club-prompts.routes.test.ts`

## Escopo do relatorio

Revalidacao das rotas dedicadas de prompts de clube apos reorganizacao interna do dominio de prompts, incluindo autenticacao, publicacao, campos opcionais, autorizacao, erros padronizados e auditoria.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
> backend@1.0.0 test
> jest --runInBand tests/club-prompts.routes.test.ts

[dotenv@17.3.1] injecting env (4) from .env.test
Resetando banco de testes...
Datasource "db": PostgreSQL database "truth_or_dare_test", schema "public" at "localhost:5432"

Applying migration `20260328161030_init`
Applying migration `20260331155538_create_feed_domain_models`
Applying migration `20260404141910_add_target_user_to_truths_and_dares`
Applying migration `20260405031052_add_dare_progress_fields`
Applying migration `20260405134121_add_likes`
Applying migration `20260408191756_add_username_and_bio_to_user`
Applying migration `20260504162510_add_dare_proofs`
Applying migration `20260506134926_add_truth_comments`
Applying migration `20260508150924_add_truth_reports`
Applying migration `20260509004417_add_club_foundation`

Database reset successful
Prisma schema loaded from prisma\schema.prisma.

PASS tests/club-prompts.routes.test.ts (13.62 s)
  club-prompts.routes
    √ retorna 401 sem token (938 ms)
    √ POST /clubs/:id/prompts cria prompt de verdade autenticado (465 ms)
    √ POST /clubs/:id/prompts cria desafio com campos opcionais (383 ms)
    √ bloqueia outsider com erro padronizado (418 ms)
    √ retorna 400 para dados invalidos (506 ms)
    √ retorna 404 para clube inexistente (266 ms)
    √ registra audit log na publicacao via rota (619 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        14.144 s
Ran all test suites matching /tests\\club-prompts.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.07s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Rejeicao de requisicao sem token.
- Publicacao autenticada de prompt de verdade.
- Publicacao autenticada de desafio com tentativas, prazo, dificuldade, destaque e anexo.
- Bloqueio de usuario fora do clube.
- Retorno 400 para dados invalidos.
- Retorno 404 para clube inexistente.
- Registro de audit log na publicacao via rota.

## Interpretacao

As rotas dedicadas continuam encaminhando corretamente a publicacao de prompts para o servico de dominio, preservando autenticacao, padrao de erro e regras de permissao apos a reorganizacao interna.

## Conclusao

A suite `club-prompts.routes.test.ts` foi reexecutada como entidade unica e passou com sucesso, com build TypeScript concluido sem erros.
