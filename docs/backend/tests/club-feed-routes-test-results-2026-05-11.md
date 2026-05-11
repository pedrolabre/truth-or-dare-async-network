## Arquivo testado

`backend/tests/club-feed.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de feed interno de clube, incluindo retorno de prompts publicados, contadores reais, estado do usuario, respostas recentes e bloqueios por permissao ou estado.

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
> jest --runInBand tests/club-feed.routes.test.ts

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

PASS tests/club-feed.routes.test.ts (8.44 s)
  GET /clubs/:id/feed
    √ retorna 401 sem token (448 ms)
    √ retorna feed interno com prompts contadores estado do usuario e respostas recentes (822 ms)
    √ oculta prompts e respostas indisponiveis (546 ms)
    √ permite visualizacao de clube publico por outsider mas bloqueia interacao (470 ms)
    √ bloqueia outsider membership inativa e clube indisponivel (1803 ms)
    √ retorna 404 para clube deletado soft deleted ou inexistente (934 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        8.678 s, estimated 9 s
Ran all test suites matching /tests\\club-feed.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.48s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para feed sem token.
- Retorno de resumo do clube no feed interno.
- Retorno de prompts publicados do clube.
- Ordenacao com prompts fixados antes dos demais.
- Retorno de contadores reais de respostas, comentarios e likes do prompt.
- Retorno de `viewerState.likedByMe` com alvo `club_prompt`.
- Retorno de `viewerState.answeredByMe` com resposta ativa do usuario.
- Retorno de `viewerState.canAnswer` conforme membership e disponibilidade do prompt.
- Retorno de respostas recentes nao removidas e nao arquivadas.
- Ocultacao de prompts arquivados.
- Ocultacao de prompts removidos.
- Ocultacao de respostas removidas.
- Ocultacao de respostas arquivadas.
- Visualizacao de clube publico por usuario autenticado fora do clube.
- Bloqueio de interacao para usuario autenticado fora do clube.
- Bloqueio de outsider em clube privado.
- Bloqueio de membership inativa.
- Bloqueio de clube arquivado.
- Bloqueio de clube suspenso.
- Retorno 404 para clube deletado.
- Retorno 404 para clube soft deleted.
- Retorno 404 para clube inexistente.

## Interpretacao

O endpoint de feed interno retorna uma superficie de clube separada do feed geral, com prompts publicados, respostas recentes, contadores persistidos e estado do visualizador calculado a partir de likes e respostas do proprio usuario.

## Conclusao

A suite `club-feed.routes.test.ts` valida com sucesso o feed interno de clube por endpoint autenticado, com build TypeScript concluido sem erros.
