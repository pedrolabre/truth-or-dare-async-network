## Arquivo testado

`backend/tests/club-prompt-comments.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de criacao de comentarios em prompts de clube, incluindo persistencia do comentario, bloqueios por permissao ou estado, validacao de payload, atualizacao de contador, atividade recente e auditoria.

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

Database reset successful
Prisma schema loaded from prisma\schema.prisma.

PASS tests/club-prompt-comments.routes.test.ts (10.278 s)
  POST /clubs/:id/prompts/:promptId/comments
    √ retorna 401 sem token (462 ms)
    √ permite membro ativo comentar prompt publicado (702 ms)
    √ retorna 400 para texto invalido (426 ms)
    √ bloqueia outsider membership inativa clube inativo e prompt indisponivel (2004 ms)
    √ retorna 404 para clube deletado prompt inexistente ou de outro clube (821 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        10.443 s
Ran all test suites matching /tests\\club-prompt-comments.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 620ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para comentario sem token.
- Criacao de comentario por membro ativo em prompt publicado.
- Retorno do contrato resumido do comentario criado.
- Incremento de `commentsCount` do prompt.
- Atualizacao de `lastActivityAt` do clube.
- Registro de audit log `club_prompt_comment_created`.
- Retorno 400 para texto vazio.
- Retorno 400 para texto acima do limite.
- Bloqueio de usuario fora do clube.
- Bloqueio de membership inativa.
- Bloqueio de comentario em clube inativo.
- Bloqueio de comentario em prompt arquivado.
- Bloqueio de comentario em prompt removido.
- Retorno 404 para clube deletado.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt pertencente a outro clube.

## Interpretacao

O endpoint de comentarios aplica as regras de acesso do dominio de clubes, valida o texto recebido, persiste o comentario na superficie do prompt e atualiza contador, atividade e auditoria de forma transacional.

## Conclusao

A suite `club-prompt-comments.routes.test.ts` valida com sucesso a criacao de comentarios em prompts de clube por endpoint autenticado, com build TypeScript concluido sem erros.
