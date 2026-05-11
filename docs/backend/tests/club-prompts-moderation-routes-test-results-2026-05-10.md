## Arquivo testado

`backend/tests/club-prompts-moderation.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de arquivamento e moderacao de prompts de clube, incluindo arquivamento pelo autor, remocao moderada por papeis autorizados, bloqueios por permissao ou estado, atualizacao de contadores e auditoria.

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
> jest --runInBand tests/club-prompts-moderation.routes.test.ts

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

PASS tests/club-prompts-moderation.routes.test.ts (11.105 s)
  DELETE /clubs/:id/prompts/:promptId moderation
    √ retorna 401 sem token (402 ms)
    √ permite autor arquivar o proprio prompt (939 ms)
    √ permite owner remover prompt de outro autor (686 ms)
    √ permite admin remover prompt de outro autor (607 ms)
    √ permite moderator remover prompt de outro autor (634 ms)
    √ bloqueia membro comum nao autor e outsider (589 ms)
    √ retorna 404 para prompt inexistente ou de outro clube (732 ms)
    √ bloqueia clube inativo e prompt ja arquivado ou removido (1834 ms)
    √ registra audit log de remocao moderada (577 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        11.287 s
Ran all test suites matching /tests\\club-prompts-moderation.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 466ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para moderacao sem token.
- Autor arquiva o proprio prompt publicado.
- Owner remove prompt de outro autor.
- Admin remove prompt de outro autor.
- Moderator remove prompt de outro autor.
- Membro comum nao autor nao remove prompt.
- Usuario fora do clube nao remove prompt.
- Prompt inexistente retorna `404`.
- Prompt pertencente a outro clube retorna `404`.
- Clube inativo bloqueia moderacao.
- Prompt ja arquivado ou removido nao pode ser moderado novamente.
- Arquivamento e remocao atualizam `promptCount`.
- Remocao moderada registra audit log `club_prompt_removed`.

## Interpretacao

O endpoint de moderacao aplica a distincao entre arquivamento pelo autor e remocao moderada por papeis autorizados. O prompt permanece persistido no banco com status atualizado, campos temporais correspondentes e auditoria do evento.

## Conclusao

A suite `club-prompts-moderation.routes.test.ts` valida com sucesso o arquivamento e a moderacao de prompts de clube por endpoint autenticado, com build TypeScript concluido sem erros.
