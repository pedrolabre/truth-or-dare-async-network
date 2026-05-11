## Arquivo testado

`backend/tests/club-prompts-detail.routes.test.ts`

## Escopo do relatorio

Revalidacao do endpoint autenticado de detalhe de prompt de clube apos a alteracao do alvo usado para calcular o estado de curtida do visualizador.

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
> jest --runInBand tests/club-prompts-detail.routes.test.ts

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

PASS tests/club-prompts-detail.routes.test.ts (10.049 s)
  GET /clubs/:id/prompts/:promptId detail
    √ retorna 401 sem token (649 ms)
    √ retorna detalhe completo do prompt para membro ativo (1930 ms)
    √ inclui respostas existentes e estado do visualizador (955 ms)
    √ calcula permissoes de detalhe para autor e moderador (993 ms)
    √ retorna 404 para prompt inexistente ou de outro clube (629 ms)
    √ bloqueia usuario sem acesso em clube privado (405 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        10.229 s
Ran all test suites matching /tests\\club-prompts-detail.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.01s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para detalhe sem token.
- Retorno do detalhe completo do prompt para membro ativo.
- Retorno dos campos completos do prompt.
- Inclusao de respostas existentes no detalhe.
- Estado `viewerState.likedByMe` calculado a partir de `targetType: club_prompt`.
- Estado `viewerState.answeredByMe` calculado a partir de resposta existente.
- Permissao de detalhe calculada para autor.
- Permissao de detalhe calculada para moderador.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt pertencente a outro clube.
- Bloqueio de usuario sem acesso a clube privado.

## Interpretacao

O endpoint de detalhe preserva o contrato existente de prompt e passa a reconhecer a curtida do visualizador pelo alvo especifico de prompt, sem depender do alvo generico de clube.

## Conclusao

A suite `club-prompts-detail.routes.test.ts` valida com sucesso o detalhe de prompt apos a troca do alvo de curtida para `club_prompt`, com build TypeScript concluido sem erros.
