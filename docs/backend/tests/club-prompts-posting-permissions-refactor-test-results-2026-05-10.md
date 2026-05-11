## Arquivo testado

`backend/tests/club-prompts-posting-permissions.routes.test.ts`

## Escopo do relatorio

Revalidacao das permissoes de postagem de prompts em clubes por endpoint autenticado apos reorganizacao interna do dominio de prompts.

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
> jest --runInBand tests/club-prompts-posting-permissions.routes.test.ts

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

PASS tests/club-prompts-posting-permissions.routes.test.ts (13.966 s)
  POST /clubs/:id/prompts posting permissions
    √ permite postagem para owner ativo (1910 ms)
    √ permite postagem para admin ativo (656 ms)
    √ permite postagem para moderator ativo (452 ms)
    √ permite postagem para member ativo (365 ms)
    √ bloqueia postagem para membro com status invited (306 ms)
    √ bloqueia postagem para membro com status requested (279 ms)
    √ bloqueia postagem para membro com status removed (257 ms)
    √ bloqueia postagem para usuario fora do clube (373 ms)
    √ bloqueia postagem em clube archived (611 ms)
    √ bloqueia postagem em clube suspended (593 ms)
    √ trata clube deletado como inexistente para postagem (291 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        14.333 s
Ran all test suites matching /tests\\club-prompts-posting-permissions.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.07s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Postagem permitida para owner ativo.
- Postagem permitida para admin ativo.
- Postagem permitida para moderator ativo.
- Postagem permitida para member ativo.
- Bloqueio de membro com status invited.
- Bloqueio de membro com status requested.
- Bloqueio de membro com status removed.
- Bloqueio de usuario fora do clube.
- Bloqueio de postagem em clube archived.
- Bloqueio de postagem em clube suspended.
- Tratamento de clube deleted como inexistente.

## Interpretacao

A publicacao de prompts continua respeitando a matriz atual de permissoes do dominio de clubes apos a reorganizacao interna. Apenas membros ativos de clubes ativos podem publicar.

## Conclusao

A suite `club-prompts-posting-permissions.routes.test.ts` foi reexecutada como entidade unica e passou com sucesso, com build TypeScript concluido sem erros.
