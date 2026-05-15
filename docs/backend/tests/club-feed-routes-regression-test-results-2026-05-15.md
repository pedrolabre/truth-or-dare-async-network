## Arquivo testado

`backend/tests/club-feed.routes.test.ts`

## Escopo do relatorio

Validacao de regressao do endpoint autenticado de feed interno de clube apos inclusao de ordenacao parametrizada, incluindo retorno de prompts publicados, contadores reais, estado do usuario, respostas recentes e bloqueios por permissao ou estado.

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

PASS tests/club-feed.routes.test.ts (9.954 s)
  GET /clubs/:id/feed
    √ retorna 401 sem token (541 ms)
    √ retorna feed interno com prompts contadores estado do usuario e respostas recentes (1008 ms)
    √ oculta prompts e respostas indisponiveis (565 ms)
    √ permite visualizacao de clube publico por outsider mas bloqueia interacao (513 ms)
    √ bloqueia outsider membership inativa e clube indisponivel (1988 ms)
    √ retorna 404 para clube deletado soft deleted ou inexistente (1129 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        10.121 s
Ran all test suites matching /tests\\club-feed.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 577ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para feed sem token.
- Retorno de resumo do clube no feed interno.
- Retorno de prompts publicados do clube.
- Preservacao da ordenacao padrao com prompts fixados antes dos demais.
- Retorno de contadores reais de respostas, comentarios e likes do prompt.
- Retorno de `viewerState.likedByMe` com alvo `club_prompt`.
- Retorno de `viewerState.answeredByMe` com resposta ativa do usuario.
- Retorno de `viewerState.canAnswer` conforme membership e disponibilidade do prompt.
- Retorno de respostas recentes nao removidas.
- Retorno de respostas recentes nao arquivadas.
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
- Preservacao do contrato anterior do endpoint apos inclusao de `order`.

## Interpretacao

A suite de regressao confirma que a inclusao da ordenacao parametrizada nao alterou as garantias centrais do feed interno de clube. O endpoint continua retornando apenas prompts publicados e disponiveis do clube solicitado, com respostas recentes filtradas, contadores persistidos e estado do visualizador calculado a partir dos registros reais de likes e respostas do proprio usuario.

Os cenarios de acesso continuam cobrindo as fronteiras mais sensiveis do dominio: usuario sem token, outsider em clube publico, outsider em clube privado, membership inativa, clubes arquivados, suspensos, deletados, soft deleted e inexistentes. Isso indica que a mudanca de ordenacao nao afrouxou as regras de visibilidade nem permitiu vazamento de conteudo indisponivel.

Como o teste preserva a expectativa de prompts fixados primeiro no comportamento padrao, ele tambem funciona como protecao contra mudancas acidentais no contrato antigo de `GET /clubs/:id/feed`. A execucao complementar do build confirma que a alteracao segue compativel com os tipos gerados pelo Prisma e com a compilacao TypeScript do backend.

## Conclusao

A suite `club-feed.routes.test.ts` valida com sucesso a regressao do feed interno de clube por endpoint autenticado, com build TypeScript concluido sem erros.
