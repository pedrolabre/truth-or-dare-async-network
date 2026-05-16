## Arquivo testado

`backend/tests/feed.service.test.ts`

## Escopo do relatorio

Validacao do service `getFeed`, cobrindo composicao de truths, dares e itens de clube projetados, contrato esperado pelo mobile e labels de desafio com expiracao e tentativas.

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
> backend@1.0.0 test
> jest --runInBand tests/feed.service.test.ts

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
PASS tests/feed.service.test.ts (6.577 s)
  getFeed
    √ deve retornar itens reais persistidos no banco para truth, dare e club (1376 ms)
    √ deve retornar feed vazio quando não houver dados persistidos (140 ms)
    √ deve preencher o contrato esperado pelo mobile para cada tipo de item (570 ms)
    √ deve retornar labels coerentes para dare com expiração e tentativas (545 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        6.756 s
Ran all test suites matching /tests\\feed.service.test.ts/i.
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

- `getFeed` retornando array.
- Inclusao de itens reais de truth.
- Inclusao de itens reais de dare.
- Inclusao de itens reais de clube.
- Feed vazio sem dados persistidos.
- Contrato de truth com `id`, `type`, `title`, `time`, `likes`, `comments`, `participants` e `extraCount`.
- Contrato de dare com `id`, `type`, `challenger`, `title`, `attemptsLabel`, `expiresIn` e `progress`.
- Contrato de clube com `id`, `type`, `clubName`, `badge`, `quote` e `answersCount`.
- Progresso de dare dentro do intervalo esperado.
- Label de tentativas de dare.
- Label de expiracao de dare.

## Interpretacao

O service `getFeed` e o orquestrador do feed geral, mas nao e dono das regras internas de clube. A suite confirma que truths, dares e itens de clube continuam sendo combinados no contrato esperado, com a projecao de clubes vindo do service dedicado.

A validacao de labels de desafio preserva comportamento historico do feed geral que nao deve ser afetado por alteracoes em clubes. Isso ajuda a garantir que a cobertura final de clubes nao cause regressao em tipos antigos do feed.

Como o build passou, a composicao do union type `FeedItem` segue compativel com o TypeScript e com os mappers atuais.

## Conclusao

A suite `feed.service.test.ts` passou com sucesso e valida a composicao do feed geral com itens de clube sem regressao nos contratos existentes.
