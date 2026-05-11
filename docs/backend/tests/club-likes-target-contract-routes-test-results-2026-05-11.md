## Arquivo testado

`backend/tests/club-likes.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de likes em clubes, incluindo uso de `Club.id` como alvo, persistencia do like com tipo de clube, remocao do like, bloqueio de ids de prompt e bloqueios por membership ou estado do clube.

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
> jest --runInBand tests/club-likes.routes.test.ts

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
Applying migration `20260511140000_add_club_prompt_response_like_types`

Database reset successful
Prisma schema loaded from prisma\schema.prisma.

PASS tests/club-likes.routes.test.ts (6.575 s)
  POST /clubs/:id/like
    √ deve criar like quando o usuario ainda nao curtiu o clube (773 ms)
    √ deve remover like quando ja estiver curtido (220 ms)
    √ deve retornar 404 quando o id informado pertence a um prompt (187 ms)
    √ deve bloquear membership inativa e clube indisponivel (305 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        6.838 s
Ran all test suites matching /tests\\club-likes.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 886ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Criacao de like em clube real por membro ativo.
- Persistencia de like com `targetType: club`.
- Uso de `Club.id` como `targetId` do like.
- Remocao de like de clube ja existente.
- Retorno 404 quando o id informado pertence a um prompt.
- Bloqueio de like por membership inativa.
- Bloqueio de like em clube arquivado.

## Interpretacao

O endpoint de likes de clubes passa a tratar `LikeTargetType.club` como alvo de clube real. A rota nao aceita mais id de prompt como se fosse clube e respeita membership ativa e disponibilidade do clube antes de alternar a curtida.

## Conclusao

A suite `club-likes.routes.test.ts` valida com sucesso o contrato de likes em clubes por endpoint autenticado, com build TypeScript concluido sem erros.
