## Arquivo testado

`backend/tests/club-prompt-comments.routes.test.ts`

## Escopo do relatorio

Validacao da criacao de comentarios em prompt de clube, incluindo contrato de retorno, incremento de contador, atualizacao de atividade, audit log, validacao de texto, autorizacao e bloqueio de prompt expirado.

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
> jest --runInBand tests/club-prompt-comments.routes.test.ts

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
PASS tests/club-prompt-comments.routes.test.ts (18.298 s)
  POST /clubs/:id/prompts/:promptId/comments
    √ retorna 401 sem token (1386 ms)
    √ permite membro ativo comentar prompt publicado (1452 ms)
    √ retorna 400 para texto invalido (765 ms)
    √ bloqueia outsider membership inativa clube inativo e prompt indisponivel (3536 ms)
    √ retorna 404 para clube deletado prompt inexistente ou de outro clube (1237 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        18.75 s
Ran all test suites matching /tests\\club-prompt-comments.routes.test.ts/i.
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
- Criacao de comentario por membro ativo.
- Retorno de `clubId`, `promptId`, `responseId`, `userId`, `userName`, `parentId`, `text`, `likesCount`, `repliesCount`, `createdAt` e `updatedAt`.
- Incremento de `ClubPrompt.commentsCount`.
- Atualizacao de `Club.lastActivityAt`.
- Criacao de audit log `club_prompt_comment_created`.
- Rejeicao de comentario em branco.
- Rejeicao de comentario acima do limite.
- Bloqueio de outsider.
- Bloqueio de membership inativa.
- Bloqueio de clube arquivado.
- Bloqueio de prompt arquivado.
- Bloqueio de prompt removido.
- Bloqueio de prompt expirado.
- Retorno 404 para clube deletado.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt de outro clube.

## Interpretacao

A criacao de comentarios altera contador persistido, atividade do clube e trilha de auditoria. Por isso a suite valida tanto o contrato da resposta HTTP quanto os efeitos colaterais no banco. O caminho feliz confirma que a interacao continua transacional e vinculada ao prompt correto.

A regressao de prompt expirado corrige a simetria das interacoes. Respostas e likes ja bloqueavam prompt expirado; comentarios agora seguem a mesma regra e nao permitem manter atividade em prompt cujo prazo tecnico ja acabou. Isso evita que feeds ordenados por atividade sejam reativados por comentarios em conteudo expirado.

Os cenarios negativos mantem a fronteira de autorizacao por membership e estado do clube, alem de impedir que um `promptId` valido em outro clube seja usado para comentar fora do escopo da rota.

## Conclusao

A suite `club-prompt-comments.routes.test.ts` passou com sucesso e valida comentarios de prompt com bloqueio de prompt expirado e contadores persistidos corretos.
