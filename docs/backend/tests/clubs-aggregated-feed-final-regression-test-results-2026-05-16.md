## Arquivo testado

`backend/tests/clubs-aggregated-feed.routes.test.ts`

## Escopo do relatorio

Validacao do feed agregado de clubes do usuario, cobrindo atividades de prompt e resposta, memberships ativas, clubes indisponiveis, prompts/respostas indisponiveis e consistencia entre `clubId` de resposta e prompt.

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
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
PASS tests/clubs-aggregated-feed.routes.test.ts (10.719 s)
  GET /clubs/feed
    √ retorna 401 sem token (684 ms)
    √ retorna 200 vazio para usuario sem clubes e preserva ordem da rota agregada (282 ms)
    √ agrega prompts e respostas recentes dos clubes ativos do usuario (1410 ms)
    √ nao vaza atividades de outsiders memberships inativas ou clubes indisponiveis (803 ms)
    √ oculta prompts e respostas arquivados ou removidos (653 ms)
    √ nao vaza prompt de outro clube por resposta com clubId inconsistente (720 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        10.983 s
Ran all test suites matching /tests\\clubs-aggregated-feed.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.10s
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 sem autenticacao.
- Retorno vazio para usuario autenticado sem clubes ativos.
- Preservacao da rota agregada antes de `/:id/feed`.
- Agregacao de prompts recentes.
- Agregacao de respostas recentes.
- Retorno de clubes publicos com membership ativa.
- Retorno de clubes privados com membership ativa.
- Retorno de contadores persistidos de prompt.
- Retorno de contadores persistidos de resposta.
- `viewerState.likedByMe` usando `club_prompt`.
- `viewerState.answeredByMe` usando resposta ativa do usuario.
- `viewerState.canAnswer` para prompt disponivel.
- Bloqueio de clube privado para outsider.
- Bloqueio de membership removida.
- Inclusao de clube `invite_only` apenas com membership ativa.
- Ocultacao de clube arquivado, suspenso, deletado e soft deleted.
- Ocultacao de prompt arquivado ou removido.
- Ocultacao de resposta arquivada ou removida.
- Bloqueio de resposta com `clubId` inconsistente em relacao ao prompt.

## Interpretacao

O feed agregado cruza varios clubes e por isso precisa ser mais restritivo que o feed interno de um clube publico. A suite confirma que apenas memberships ativas entram na consulta inicial e que clubes indisponiveis nao participam da timeline.

A validacao de resposta com vinculo inconsistente cobre um risco relevante em consultas agregadas: uma resposta nao pode vazar prompt de outro clube apenas por carregar um `clubId` permitido. O filtro exige que o prompt relacionado tambem pertenca ao conjunto de clubes autorizados.

O retorno de prompt e resposta em uma unica timeline continua usando dados persistidos e mappers do dominio de clubes. Isso preserva o feed agregado como superficie de clubes, separada do feed geral global.

## Conclusao

A suite `clubs-aggregated-feed.routes.test.ts` passou com sucesso e valida o feed agregado de clubes com isolamento por membership e consistencia de vinculos.
