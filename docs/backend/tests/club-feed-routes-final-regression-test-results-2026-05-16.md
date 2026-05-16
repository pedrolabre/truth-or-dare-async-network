## Arquivo testado

`backend/tests/club-feed.routes.test.ts`

## Escopo do relatorio

Validacao do feed interno de clube, cobrindo prompts publicados, contadores persistidos, estado do usuario, respostas recentes, ocultacao de conteudo indisponivel e permissoes de leitura/interacao.

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
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
PASS tests/club-feed.routes.test.ts (14.621 s)
  GET /clubs/:id/feed
    √ retorna 401 sem token (643 ms)
    √ retorna feed interno com prompts contadores estado do usuario e respostas recentes (1271 ms)
    √ oculta prompts e respostas indisponiveis (794 ms)
    √ permite visualizacao de clube publico por outsider mas bloqueia interacao (750 ms)
    √ bloqueia outsider membership inativa e clube indisponivel (2683 ms)
    √ retorna 404 para clube deletado soft deleted ou inexistente (1497 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        14.887 s
Ran all test suites matching /tests\\club-feed.routes.test.ts/i.
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
- Retorno do resumo do clube no feed interno.
- Retorno de prompts publicados do clube solicitado.
- Retorno de `answersCount`, `commentsCount` e `likesCount`.
- `viewerState.likedByMe` calculado com `club_prompt`.
- `viewerState.answeredByMe` calculado por resposta ativa.
- `viewerState.canAnswer` verdadeiro para membro ativo e prompt disponivel.
- Retorno de respostas recentes nao removidas e nao arquivadas.
- Ocultacao de prompts arquivados.
- Ocultacao de prompts removidos.
- Ocultacao de respostas removidas.
- Ocultacao de respostas arquivadas.
- Visualizacao de clube publico por outsider autenticado.
- Bloqueio de interacao para outsider em clube publico.
- Bloqueio de outsider em clube privado.
- Bloqueio de membership inativa.
- Bloqueio de clube arquivado ou suspenso.
- Retorno 404 para clube deletado, soft deleted ou inexistente.

## Interpretacao

O feed interno e a superficie mais completa para leitura de prompts dentro de um clube especifico. A suite confirma que ele permanece dono do contexto interno do clube: retorna prompts, contadores, estado do visualizador e respostas recentes, sem depender do feed geral.

A regressao e importante porque respostas arquivadas ou removidas nao podem reaparecer como atividade recente. A suite tambem preserva a diferenca entre leitura e interacao: outsider autenticado pode ler clube publico, mas nao recebe permissao para responder.

Os bloqueios por estado do clube e por membership impedem vazamento de feed privado ou indisponivel. Como o build passou, a superficie continua compativel com os DTOs e mappers atuais.

## Conclusao

A suite `club-feed.routes.test.ts` passou com sucesso e valida o feed interno de clube com respostas recentes, contadores e permissoes preservados.
