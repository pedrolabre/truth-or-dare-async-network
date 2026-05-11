## Arquivo testado

`backend/tests/club-prompt-responses-list.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de listagem de respostas de prompts de clube, incluindo paginacao, ordenacao, ocultacao de respostas removidas, bloqueios por permissao ou estado e tratamento de recursos inexistentes.

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
> jest --runInBand tests/club-prompt-responses-list.routes.test.ts

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

PASS tests/club-prompt-responses-list.routes.test.ts (12.103 s)
  GET /clubs/:id/prompts/:promptId/responses
    √ retorna 401 sem token (425 ms)
    √ lista respostas nao removidas com paginacao padrao e ordenacao recente (1086 ms)
    √ aplica pagina e ordenacao por mais antigas (725 ms)
    √ bloqueia outsider membership inativa clube inativo e prompt indisponivel (2996 ms)
    √ retorna 404 para clube deletado prompt inexistente ou de outro clube (1499 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        12.278 s
Ran all test suites matching /tests\\club-prompt-responses-list.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 853ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para listagem sem token.
- Listagem de respostas nao removidas por membro ativo.
- Paginacao padrao com `page`, `limit`, `total` e `totalPages`.
- Ordenacao padrao por respostas mais recentes.
- Ordenacao por respostas mais antigas com `sort=oldest`.
- Aplicacao de `page` e `limit`.
- Ocultacao de resposta com `removedAt`.
- Bloqueio de usuario fora do clube.
- Bloqueio de membership inativa.
- Bloqueio de listagem em clube inativo.
- Bloqueio de listagem em prompt arquivado.
- Bloqueio de listagem em prompt removido.
- Retorno 404 para clube deletado.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt pertencente a outro clube.

## Interpretacao

O endpoint de listagem aplica as mesmas regras de acesso do dominio de respostas, preserva a superficie ativa do prompt e retorna apenas respostas visiveis com contrato paginado e ordenacao previsivel.

## Conclusao

A suite `club-prompt-responses-list.routes.test.ts` valida com sucesso a listagem paginada de respostas de prompts de clube por endpoint autenticado, com build TypeScript concluido sem erros.
