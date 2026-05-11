## Arquivo testado

`backend/tests/club-prompts-fields.routes.test.ts`

## Escopo do relatorio

Validacao do contrato completo dos campos de prompt de clube nas superficies de criacao, detalhe, edicao e moderacao, incluindo tipo, conteudo, maximo de tentativas, prazo, dificuldade, anexos e destaque.

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
> jest --runInBand tests/club-prompts-fields.routes.test.ts

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

PASS tests/club-prompts-fields.routes.test.ts (7.05 s)
  club prompt fields contract
    √ cria desafio com campos completos e retorna os mesmos campos no detalhe (1096 ms)
    √ edita campos completos e preserva contrato no detalhe (380 ms)
    √ preserva campos do prompt no retorno apos arquivamento ou moderacao (372 ms)
    √ valida prazo anexos e destaque por papel (292 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        7.275 s
Ran all test suites matching /tests\\club-prompts-fields.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 431ms
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Criacao de desafio com tipo, conteudo, maximo de tentativas, prazo, dificuldade, anexos, destaque e visibilidade.
- Leitura detalhada preservando os campos informados na criacao.
- Criacao de verdade ignorando `maxAttempts` e retornando `null`.
- Edicao de tipo, conteudo, maximo de tentativas, prazo, dificuldade, anexos, destaque e visibilidade.
- Leitura detalhada preservando os campos apos edicao.
- Arquivamento pelo autor preservando campos do prompt no retorno.
- Remocao moderada preservando campos do prompt no retorno.
- Validacao de prazo passado.
- Validacao de anexo invalido.
- Bloqueio de destaque por membro comum.

## Interpretacao

O contrato completo dos campos de prompt permanece consistente entre criacao, detalhe, edicao e moderacao. As regras especificas de verdade/desafio, anexos, prazo e destaque sao aplicadas antes da persistencia e os campos persistidos continuam disponiveis nas respostas posteriores.

## Conclusao

A suite `club-prompts-fields.routes.test.ts` valida com sucesso o contrato completo dos campos de prompt de clube, com build TypeScript concluido sem erros.
