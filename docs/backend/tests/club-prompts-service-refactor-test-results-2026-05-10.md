## Arquivo testado

`backend/tests/club-prompts.service.test.ts`

## Escopo do relatorio

Revalidacao automatizada do servico responsavel pela criacao de prompts de verdade e desafio em clubes apos reorganizacao interna de validadores e mapeadores.

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
> backend@1.0.0 test
> jest --runInBand tests/club-prompts.service.test.ts

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

PASS tests/club-prompts.service.test.ts (10.02 s)
  club-prompts.service
    √ cria prompt de verdade por membro ativo e atualiza contadores do clube (1082 ms)
    √ cria prompt de desafio com tentativas, prazo, dificuldade e anexos (454 ms)
    √ registra audit log de criacao de prompt (465 ms)
    √ bloqueia outsider e membro sem status ativo (631 ms)
    √ bloqueia criacao em clube arquivado (147 ms)
    √ valida tipo, conteudo, prazo e anexos invalidos (280 ms)
    √ permite fixar prompt apenas por owner, admin ou moderator (357 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        10.332 s
Ran all test suites matching /tests\\club-prompts.service.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.07s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Criacao de prompt de verdade por membro ativo.
- Atualizacao de `promptCount` e `lastActivityAt` do clube.
- Criacao de prompt de desafio com tentativas, prazo, dificuldade e anexos.
- Registro de audit log para criacao de prompt.
- Bloqueio de outsider e membro sem status ativo.
- Bloqueio de criacao em clube arquivado.
- Validacao de tipo, conteudo, prazo e anexos invalidos.
- Permissao para fixar prompt restrita a owner, admin ou moderator.

## Interpretacao

O servico manteve o comportamento esperado apos a extracao de validadores e mapeadores. A criacao de prompts continua aplicando regras de permissao, validacao, persistencia, contadores e auditoria.

## Conclusao

A suite `club-prompts.service.test.ts` foi reexecutada como entidade unica e passou com sucesso, com build TypeScript concluido sem erros.
