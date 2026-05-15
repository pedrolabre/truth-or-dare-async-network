## Arquivo testado

`backend/tests/club-feed-ordering.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de feed interno de clube com ordenacao parametrizada, incluindo comportamento padrao, atividade recente, relevancia por contadores persistidos, prazo mais proximo, conteudo fixado e rejeicao de ordenacao invalida.

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
> jest --runInBand tests/club-feed-ordering.routes.test.ts

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

PASS tests/club-feed-ordering.routes.test.ts (7.297 s)
  GET /clubs/:id/feed ordering
    √ preserva ordenacao padrao com fixados primeiro (916 ms)
    √ ordena por atividade recente (343 ms)
    √ ordena por relevancia usando contadores persistidos (292 ms)
    √ ordena por prazo proximo e envia prazos nulos para o fim (314 ms)
    √ ordena por conteudo fixado com secundaria estavel (281 ms)
    √ retorna 400 para ordenacao invalida (295 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        7.504 s
Ran all test suites matching /tests\\club-feed-ordering.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 577ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 200 para feed interno sem query de ordenacao.
- Preservacao do comportamento padrao com prompts fixados antes dos demais.
- Ordenacao secundaria padrao por publicacao mais recente.
- Retorno de todos os prompts publicados disponiveis no feed interno.
- Ordenacao por `order=activity`.
- Uso de atividade recente como criterio primario em `order=activity`.
- Preservacao de secundaria estavel por publicacao e criacao em `order=activity`.
- Ordenacao por `order=relevance`.
- Uso de `likesCount` como primeiro sinal persistido de relevancia.
- Uso de `commentsCount` como segundo sinal persistido de relevancia.
- Uso de `answersCount` como terceiro sinal persistido de relevancia.
- Preservacao de secundaria por atividade quando os sinais de relevancia empatam.
- Ordenacao por `order=deadline`.
- Priorizacao de `expiresAt` mais proximo em `order=deadline`.
- Envio de prompts sem prazo para o fim da lista.
- Ordenacao por `order=pinned`.
- Priorizacao de `isPinned` em `order=pinned`.
- Preservacao de secundaria estavel em `order=pinned`.
- Rejeicao de `order` invalido.
- Retorno 400 para ordenacao invalida.
- Retorno de `CLUB_VALIDATION_ERROR` para ordenacao invalida.
- Manutencao do contrato do endpoint autenticado de feed interno.
- Validacao sem alteracao de schema Prisma.
- Validacao sem alterar o feed geral global.
- Validacao sem aplicar ordenacoes avancadas no feed agregado de clubes.

## Interpretacao

A suite demonstra que a ordenacao do feed interno foi adicionada como extensao controlada do contrato existente, sem alterar a superficie principal do endpoint. A ausencia de `order` continua preservando o comportamento anterior, com prompts fixados em primeiro lugar e ordenacao secundaria previsivel, o que reduz risco de regressao para consumidores ja existentes.

Os modos novos usam apenas campos persistidos do proprio prompt de clube. `activity` usa atividade recente como criterio primario, `relevance` usa contadores ja sincronizados no dominio, `deadline` prioriza prompts com prazo mais proximo e trata `expiresAt` nulo de forma explicita, e `pinned` mantem o destaque de conteudo fixado com desempate estavel. Isso confirma que a implementacao nao introduz ranking externo, recomendacao, recalculo artificial de contadores ou dependencia de dados fora do escopo do feed interno.

A validacao de `order` invalido tambem confirma que o endpoint rejeita valores desconhecidos com erro padronizado do dominio de clubes, evitando fallback silencioso para uma ordenacao inesperada. Como a suite foi executada com banco resetado e build TypeScript concluido, o comportamento foi validado contra Prisma, PostgreSQL e o contrato de tipos atual, sem necessidade de alteracao de schema.

## Conclusao

A suite `club-feed-ordering.routes.test.ts` valida com sucesso a ordenacao do feed interno de clube por endpoint autenticado, com build TypeScript concluido sem erros.
