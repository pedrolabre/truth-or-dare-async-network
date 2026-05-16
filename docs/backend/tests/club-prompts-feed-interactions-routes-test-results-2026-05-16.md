## Arquivo testado

`backend/tests/club-prompts-feed-interactions.routes.test.ts`

## Escopo do relatorio

Validacao route-level das interacoes entre publicacao de prompt de clube, feed interno, feed agregado de clubes, feed geral, respostas, comentarios, likes de prompt, likes de resposta e regras de visibilidade para usuario fora do clube.

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
> jest --runInBand tests/club-prompts-feed-interactions.routes.test.ts

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
PASS tests/club-prompts-feed-interactions.routes.test.ts (19.725 s)
  club prompt feed interactions
    √ propaga prompt publicado e interacoes para feed interno agregado e geral (2658 ms)
    √ remove prompt arquivado das superficies de feed de clubes e feed geral (888 ms)
    √ mantem responsabilidades separadas para outsider feed agregado e feed geral (869 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        20.088 s
Ran all test suites matching /tests\\club-prompts-feed-interactions.routes.test.ts/i.
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

- Publicacao real de prompt por `POST /clubs/:id/prompts`.
- Retorno do prompt publicado em `GET /clubs/:id/feed`.
- Retorno do prompt publicado em `GET /clubs/feed` para membro ativo.
- Projecao do prompt publicado em `GET /feed` para membro ativo.
- Contrato do item `type: club` no feed geral com `clubName`, `badge`, `quote`, `answersCount`, `likesCount` e `likedByMe`.
- Like de prompt usando `LikeTargetType.club_prompt`.
- Resposta de desafio incrementando `ClubPrompt.answersCount`.
- Comentario de prompt incrementando `ClubPrompt.commentsCount`.
- Like de resposta usando `LikeTargetType.club_response`.
- Like de resposta sem alterar `ClubPrompt.likesCount`.
- Feed interno refletindo contadores persistidos e estado do usuario.
- Feed agregado refletindo atividade de prompt e atividade de resposta.
- Feed geral refletindo apenas contadores suportados pelo contrato publico atual.
- Arquivamento de prompt removendo a atividade do feed interno, do feed agregado e do feed geral.
- Usuario outsider autenticado sem membership recebendo feed agregado vazio.
- Usuario outsider autenticado vendo apenas prompt publico nao `members only` no feed geral.
- Separacao entre `GET /clubs/:id/feed`, `GET /clubs/feed` e `GET /feed`.

## Interpretacao

A suite cobre o risco de regressao entre superficies, que nao era completamente exercitado por testes isolados de service ou de uma unica rota. O fluxo inicia pela publicacao real do prompt, passa pelas interacoes de like, resposta e comentario, e entao verifica as tres leituras de feed que consomem esses dados em contratos diferentes.

O teste tambem confirma que os contadores exibidos nos feeds nao sao recalculados de forma ad hoc pelo feed geral. `answersCount` e `likesCount` chegam ao item de clube do feed geral a partir de campos persistidos, enquanto o feed interno e o agregado preservam tambem `commentsCount`, `viewerState` e respostas recentes. Isso reduz o risco de uma superficie parecer correta enquanto outra fica defasada.

A validacao de arquivamento demonstra que prompt indisponivel deixa de aparecer em todas as superficies de feed, sem alterar endpoints ou schema. A validacao de outsider reforca que o feed agregado pertence aos clubes do usuario e que o feed geral aplica uma projecao mais restrita para prompts de clube publicos.

## Conclusao

A suite `club-prompts-feed-interactions.routes.test.ts` passou com sucesso e fecha a cobertura route-level das interacoes entre prompts de clube, feeds, respostas, comentarios, likes e permissoes de leitura.
