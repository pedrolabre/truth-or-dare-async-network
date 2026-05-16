## Arquivo testado

`backend/tests/feed.service.test.ts`

## Escopo do relatorio

Validacao de regressao do servico de feed geral apos a separacao da projecao de prompts de clube, incluindo retorno de itens persistidos, preservacao das quantidades por tipo, feed vazio, contrato esperado pelo mobile e labels de desafios.

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
PASS tests/feed.service.test.ts (6.008 s)
  getFeed
    √ deve retornar itens reais persistidos no banco para truth, dare e club (1289 ms)
    √ deve retornar feed vazio quando não houver dados persistidos (52 ms)
    √ deve preencher o contrato esperado pelo mobile para cada tipo de item (408 ms)
    √ deve retornar labels coerentes para dare com expiração e tentativas (347 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        6.119 s, estimated 10 s
Ran all test suites matching /tests\\feed.service.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 890ms

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno de itens reais persistidos para truth, dare e club.
- Retorno de 7 itens no cenario base do feed.
- Retorno de 2 itens de truth.
- Retorno de 2 itens de dare.
- Retorno de 3 itens de club.
- Preservacao de truth conhecida pelo conteudo esperado.
- Preservacao de dare conhecido por autor e conteudo esperados.
- Preservacao de item de clube conhecido por `clubName`, `badge` e `quote`.
- Retorno de lista vazia quando nao ha dados persistidos.
- Preservacao do contrato mobile para item truth.
- Retorno de `id`, `type`, `title`, `time`, `likes`, `comments`, `participants` e `extraCount` em truth.
- Preservacao de `likes` e `likesCount` em truth para compatibilidade.
- Preservacao do contrato mobile para item dare.
- Retorno de `id`, `type`, `challenger`, `title`, `attemptsLabel`, `expiresIn` e `progress` em dare.
- Preservacao de `status`, `attemptsUsed`, `maxAttempts`, `completedAt`, `expiresAt`, `interactionDisabled`, `likesCount` e `likedByMe` em dare.
- Preservacao do contrato mobile para item club.
- Retorno de `id`, `type`, `clubName`, `badge`, `quote` e `answersCount` em club.
- Preservacao de `likesCount` e `likedByMe` em club.
- Validacao de label de tentativas em dare.
- Validacao de label de expiracao em dare.
- Validacao de `progress` entre 0 e 1 em dare.
- Validacao sem alteracao de schema Prisma.

## Interpretacao

A suite demonstra que o servico `getFeed` continua sendo a superficie agregadora do feed geral, mesmo apos a projecao de clubes ter sido movida para um servico dedicado. Truths e dares preservam o comportamento anterior, enquanto itens de clube continuam aparecendo no mesmo contrato consumido pelo mobile.

O cenario base funciona como regressao de integracao entre os tres tipos de item. Ele valida a quantidade esperada de truths, dares e clubs, confirma que conteudos conhecidos continuam presentes e protege o contrato publico contra mudancas acidentais no shape dos objetos retornados.

A validacao especifica de labels de desafio confirma que a alteracao na projecao de clubes nao afetou calculos ja existentes de dare, como tentativas, expiracao e progresso. Como a suite foi executada com banco resetado e build TypeScript concluido, a regressao foi validada contra Prisma, PostgreSQL e os tipos atuais.

## Conclusao

A suite `feed.service.test.ts` valida com sucesso a regressao do servico de feed geral apos a separacao da projecao de clubes, com contrato mobile preservado e build TypeScript concluido sem erros.
