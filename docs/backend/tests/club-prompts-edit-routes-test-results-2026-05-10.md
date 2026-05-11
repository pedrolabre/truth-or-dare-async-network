## Arquivo testado

`backend/tests/club-prompts-edit.routes.test.ts`

## Escopo do relatorio

Validacao do endpoint autenticado de edicao de prompt de clube, incluindo atualizacao de campos completos, regras de autoria, regras de administracao, janela de edicao, bloqueios por estado do prompt ou clube, validacao de payload e auditoria.

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
> jest --runInBand tests/club-prompts-edit.routes.test.ts

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

PASS tests/club-prompts-edit.routes.test.ts (9.159 s)
  PATCH /clubs/:id/prompts/:promptId edit
    √ retorna 401 sem token (414 ms)
    √ permite autor editar campos completos dentro da janela (717 ms)
    √ permite owner e admin editarem prompt de outro autor (545 ms)
    √ bloqueia membro autor tentando fixar prompt (437 ms)
    √ bloqueia moderator nao autor e membro comum nao autor (448 ms)
    √ bloqueia autor apos janela de edicao ou com resposta existente (876 ms)
    √ bloqueia prompt arquivado removido ou clube inativo (1280 ms)
    √ retorna 400 para payload invalido ou vazio (447 ms)
    √ retorna 404 para prompt inexistente ou de outro clube (509 ms)
    √ registra audit log ao editar prompt (449 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        9.378 s, estimated 11 s
Ran all test suites matching /tests\\club-prompts-edit.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.13s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para edicao sem token.
- Edicao de campos completos por autor dentro da janela permitida.
- Edicao por owner e admin em prompt de outro autor.
- Bloqueio de membro autor tentando fixar prompt.
- Bloqueio de moderator nao autor.
- Bloqueio de membro comum nao autor.
- Bloqueio de autor apos a janela de edicao.
- Bloqueio de autor quando ja existe resposta no prompt.
- Bloqueio de prompt arquivado ou removido.
- Bloqueio de edicao em clube inativo.
- Retorno 400 para payload invalido ou vazio.
- Retorno 404 para prompt inexistente ou pertencente a outro clube.
- Registro de audit log `club_prompt_updated`.

## Interpretacao

O endpoint de edicao aplica as regras de autorizacao esperadas para autoria e administracao, preserva a restricao de destaque por papel e atualiza o contrato completo de campos editaveis. A auditoria de edicao e os bloqueios por estado foram confirmados com consultas ao banco de testes.

## Conclusao

A suite `club-prompts-edit.routes.test.ts` valida com sucesso a edicao de prompts de clube por endpoint autenticado, com build TypeScript concluido sem erros.
