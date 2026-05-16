## Arquivo testado

`backend/tests/club-prompt-responses-list.routes.test.ts`

## Escopo do relatorio

Validacao da listagem paginada de respostas de prompt de clube, cobrindo ordenacao, paginacao, filtros de disponibilidade, autorizacao por membership e regressao para respostas arquivadas.

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
Applying migration `20260511140000_add_club_prompt_response_like_types`

Database reset successful
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
PASS tests/club-prompt-responses-list.routes.test.ts (16.45 s)
  GET /clubs/:id/prompts/:promptId/responses
    √ retorna 401 sem token (645 ms)
    √ lista respostas nao removidas com paginacao padrao e ordenacao recente (1527 ms)
    √ aplica pagina e ordenacao por mais antigas (1121 ms)
    √ bloqueia outsider membership inativa clube inativo e prompt indisponivel (4605 ms)
    √ retorna 404 para clube deletado prompt inexistente ou de outro clube (2181 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        16.721 s
Ran all test suites matching /tests\\club-prompt-responses-list.routes.test.ts/i.
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
- Listagem com paginacao padrao.
- Ordenacao padrao por respostas mais recentes.
- Total de paginacao considerando apenas respostas disponiveis.
- Exclusao de resposta removida.
- Exclusao de resposta arquivada.
- Ordenacao por respostas mais antigas com `sort=oldest`.
- Paginacao por `page` e `limit`.
- Bloqueio de outsider.
- Bloqueio de membership inativa.
- Bloqueio de clube suspenso.
- Bloqueio de prompt arquivado.
- Bloqueio de prompt removido.
- Retorno 404 para clube deletado.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt pertencente a outro clube.

## Interpretacao

A listagem de respostas precisa ser mais estrita que uma simples consulta por `promptId`, porque respostas arquivadas e removidas nao devem afetar a leitura publica do prompt nem a paginacao. A regressao adicionada garante que `archivedAt` e `removedAt` sejam tratados como indisponibilidade equivalente para esta superficie.

O teste de paginacao e ordenacao confirma que o filtro de disponibilidade acontece antes do calculo de total e antes da montagem das paginas. Isso evita um bug sutil em que o cliente receberia menos itens que o total anunciado ou navegaria por paginas preenchidas por registros arquivados.

Os bloqueios de acesso continuam cobrindo o limite entre clube, prompt e membership. A rota nao lista respostas para usuario fora do clube, membership inativa, clube indisponivel ou prompt fora do clube informado.

## Conclusao

A suite `club-prompt-responses-list.routes.test.ts` passou com sucesso e valida que apenas respostas ativas entram na listagem paginada.
