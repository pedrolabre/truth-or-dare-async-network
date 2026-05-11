## Arquivo testado

`backend/tests/club-prompts-detail.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de detalhe completo de prompt de clube, incluindo contrato de resposta, respostas vinculadas, estado do visualizador, autorizacao e tratamento de prompt inexistente ou pertencente a outro clube.

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

Database reset successful
Prisma schema loaded from prisma\schema.prisma.

PASS tests/club-prompts-detail.routes.test.ts (9.139 s)
  GET /clubs/:id/prompts/:promptId detail
    √ retorna 401 sem token (674 ms)
    √ retorna detalhe completo do prompt para membro ativo (1260 ms)
    √ inclui respostas existentes e estado do visualizador (647 ms)
    √ calcula permissoes de detalhe para autor e moderador (611 ms)
    √ retorna 404 para prompt inexistente ou de outro clube (623 ms)
    √ bloqueia usuario sem acesso em clube privado (524 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        9.395 s
Ran all test suites matching /tests\\club-prompts-detail.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.22s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para detalhe de prompt sem token.
- Retorno 200 para membro ativo visualizando detalhe completo.
- Contrato completo do prompt com tipo, conteudo, tentativas, prazo, dificuldade, anexos, destaque, campos de arquivamento e campos de moderacao.
- Inclusao de respostas existentes com dados do autor da resposta.
- Estado do visualizador com `likedByMe`, `answeredByMe`, `canAnswer`, `canEdit` e `canRemove`.
- Permissoes de detalhe para autor, moderador e membro comum.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt que nao pertence ao clube informado.
- Retorno 403 para usuario sem acesso a clube privado.

## Interpretacao

O endpoint de detalhe retorna o contrato esperado para prompts de clube e preserva as regras de acesso do dominio. A resposta diferencia corretamente estado do visualizador, relacao do prompt com o clube solicitado e disponibilidade de respostas vinculadas.

## Conclusao

A suite `club-prompts-detail.routes.test.ts` valida com sucesso o detalhe completo de prompts de clube por endpoint autenticado, com build TypeScript concluido sem erros.
