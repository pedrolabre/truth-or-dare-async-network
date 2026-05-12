## Arquivo testado

`backend/tests/clubs-aggregated-feed.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de feed agregado de clubes, incluindo agregacao de atividades entre clubes do usuario, filtragem por membership ativa, estados de clube, disponibilidade de prompts e respostas, contadores persistidos, estado do visualizador e isolamento entre resposta, prompt e clube.

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
> jest --runInBand tests/clubs-aggregated-feed.routes.test.ts

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

PASS tests/clubs-aggregated-feed.routes.test.ts (12.072 s)
  GET /clubs/feed
    √ retorna 401 sem token (729 ms)
    √ retorna 200 vazio para usuario sem clubes e preserva ordem da rota agregada (230 ms)
    √ agrega prompts e respostas recentes dos clubes ativos do usuario (1065 ms)
    √ nao vaza atividades de outsiders memberships inativas ou clubes indisponiveis (717 ms)
    √ oculta prompts e respostas arquivados ou removidos (638 ms)
    √ nao vaza prompt de outro clube por resposta com clubId inconsistente (630 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        12.364 s
Ran all test suites matching /tests\\clubs-aggregated-feed.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 674ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para requisicao sem token.
- Retorno 200 com lista vazia para usuario autenticado sem clubes.
- Registro de `GET /clubs/feed` antes de `GET /clubs/:id/feed`.
- Agregacao de prompts recentes entre clubes ativos do usuario.
- Agregacao de respostas recentes entre clubes ativos do usuario.
- Retorno de atividades de clubes publicos, privados e invite_only quando ha membership ativa.
- Bloqueio de atividades de clubes em que o usuario e outsider.
- Bloqueio de atividades de clubes com membership removida.
- Bloqueio de atividades de clubes arquivados.
- Bloqueio de atividades de clubes suspensos.
- Bloqueio de atividades de clubes deletados.
- Bloqueio de atividades de clubes soft deleted.
- Ocultacao de prompts arquivados.
- Ocultacao de prompts removidos.
- Ocultacao de respostas arquivadas.
- Ocultacao de respostas removidas.
- Uso de contadores persistidos de prompts e respostas.
- Calculo de `viewerState.likedByMe` com alvo `club_prompt`.
- Calculo de `viewerState.answeredByMe` com resposta ativa do usuario.
- Calculo de `viewerState.canAnswer` conforme membership ativa e disponibilidade do prompt.
- Bloqueio de resposta com `clubId` acessivel quando o `promptId` pertence a prompt de outro clube.

## Interpretacao

O endpoint retorna uma superficie agregada de atividades dos clubes do usuario sem depender do feed geral global. As atividades sao limitadas a clubes ativos em que o visualizador possui membership ativa, respeitam os estados de prompts, respostas e alvos de like especificos, e validam o vinculo do prompt relacionado a cada resposta agregada.

## Conclusao

A suite `clubs-aggregated-feed.routes.test.ts` valida com sucesso o feed agregado de clubes por endpoint autenticado, com build TypeScript concluido sem erros.
