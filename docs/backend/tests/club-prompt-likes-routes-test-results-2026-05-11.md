## Arquivo testado

`backend/tests/club-prompt-likes.routes.test.ts`

## Escopo do relatorio

Validacao dos endpoints autenticados de likes em prompts e respostas de prompts de clube, incluindo separacao dos tipos de alvo, persistencia do like, remocao do like, sincronizacao de contadores e bloqueios por permissao ou estado.

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
> jest --runInBand tests/club-prompt-likes.routes.test.ts

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

PASS tests/club-prompt-likes.routes.test.ts (16.703 s)
  POST /clubs/:id/prompts/:promptId/like
    √ retorna 401 sem token (500 ms)
    √ alterna like de prompt usando targetType club_prompt e sincroniza ClubPrompt.likesCount (949 ms)
    √ usa club_prompt no estado likedByMe do detalhe do prompt (792 ms)
    √ bloqueia outsider membership inativa clube inativo e prompt indisponivel (3346 ms)
    √ retorna 404 para clube deletado prompt inexistente ou prompt de outro clube (994 ms)
  POST /clubs/:id/prompts/:promptId/responses/:responseId/like
    √ alterna like de resposta usando targetType club_response e sincroniza ClubPromptResponse.likesCount (539 ms)
    √ bloqueia response arquivada removida ou de prompt indisponivel (1898 ms)
    √ retorna 404 para resposta inexistente ou vinculada a outro prompt (1213 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        17.071 s
Ran all test suites matching /tests\\club-prompt-likes.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.01s
Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para like de prompt sem token.
- Criacao de like de prompt por membro ativo.
- Persistencia de like de prompt com `targetType: club_prompt`.
- Incremento de `ClubPrompt.likesCount`.
- Remocao de like de prompt ja existente.
- Sincronizacao de `ClubPrompt.likesCount` apos remocao.
- Estado `viewerState.likedByMe` calculado com `club_prompt`.
- Bloqueio de usuario fora do clube.
- Bloqueio de membership inativa.
- Bloqueio de like em clube arquivado.
- Bloqueio de like em clube suspenso.
- Bloqueio de like em prompt arquivado.
- Bloqueio de like em prompt removido.
- Bloqueio de like em prompt expirado.
- Retorno 404 para clube deletado.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt pertencente a outro clube.
- Criacao de like de resposta por membro ativo.
- Persistencia de like de resposta com `targetType: club_response`.
- Incremento de `ClubPromptResponse.likesCount`.
- Garantia de que like de resposta nao altera `ClubPrompt.likesCount`.
- Remocao de like de resposta ja existente.
- Bloqueio de like em resposta arquivada.
- Bloqueio de like em resposta removida.
- Bloqueio de like em resposta quando o prompt esta indisponivel.
- Retorno 404 para resposta inexistente.
- Retorno 404 para resposta vinculada a outro prompt.

## Interpretacao

Os endpoints de likes aplicam as regras de acesso do dominio de clubes, usam alvos distintos para prompt e resposta, persistem ou removem a curtida conforme o estado anterior e sincronizam o contador no registro correto.

## Conclusao

A suite `club-prompt-likes.routes.test.ts` valida com sucesso os likes especificos de prompts e respostas de prompts de clube por endpoints autenticados, com build TypeScript concluido sem erros.
