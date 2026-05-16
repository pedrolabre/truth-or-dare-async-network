## Arquivo testado

`backend/tests/club-prompts-detail.routes.test.ts`

## Escopo do relatorio

Validacao do detalhe completo de prompt de clube, incluindo contrato de campos, respostas associadas, estado do visualizador, permissoes, isolamento por clube e regressao para respostas arquivadas ou removidas.

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
> jest --runInBand tests/club-prompts-detail.routes.test.ts

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
PASS tests/club-prompts-detail.routes.test.ts (11.39 s)
  GET /clubs/:id/prompts/:promptId detail
    √ retorna 401 sem token (639 ms)
    √ retorna detalhe completo do prompt para membro ativo (996 ms)
    √ inclui respostas existentes e estado do visualizador (627 ms)
    √ ignora respostas arquivadas ou removidas no detalhe e no answeredByMe (602 ms)
    √ marca prompt expirado como indisponivel para resposta no detalhe (558 ms)
    √ calcula permissoes de detalhe para autor e moderador (614 ms)
    √ retorna 404 para prompt inexistente ou de outro clube (724 ms)
    √ bloqueia usuario sem acesso em clube privado (421 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        11.667 s
Ran all test suites matching /tests\\club-prompts-detail.routes.test.ts/i.
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
- Retorno do contrato completo do prompt para membro ativo.
- Preservacao de `type`, `status`, `content`, `difficulty`, `maxAttempts`, `expiresAt`, `isPinned`, `isMembersOnly` e anexos.
- Estado inicial do visualizador sem like e sem resposta ativa.
- Inclusao de resposta ativa existente no detalhe.
- `viewerState.likedByMe` calculado por `LikeTargetType.club_prompt`.
- `viewerState.answeredByMe` verdadeiro quando ha resposta ativa do usuario.
- Ocultacao de respostas removidas no detalhe.
- Ocultacao de respostas arquivadas no detalhe.
- Resposta arquivada ou removida nao marcando `answeredByMe`.
- Prompt expirado retornando `viewerState.canAnswer: false`.
- Permissao de edicao para autor dentro da janela.
- Permissao de remocao para autor e moderador.
- Retorno 404 para prompt inexistente.
- Retorno 404 para prompt vinculado a outro clube.
- Bloqueio de usuario sem acesso a clube privado.

## Interpretacao

A suite protege o detalhe como superficie de leitura rica, que e mais sensivel que os feeds porque agrega campos do prompt, respostas e estado calculado do visualizador. A regressao adicionada impede que respostas arquivadas continuem visiveis ou influenciem `answeredByMe`, preservando a diferenca entre resposta ativa e historico indisponivel.

A validacao de prompt expirado fecha outro ponto de permissao importante. O detalhe ainda pode ser lido por usuario autorizado, mas o estado do visualizador nao deve sugerir que a resposta continua disponivel. Isso alinha o contrato do detalhe com as regras ja aplicadas nas interacoes de resposta e like.

Os testes de isolamento por clube e de clube privado continuam garantindo que o detalhe nao vira uma rota de vazamento por id conhecido. O build confirma que as alteracoes de permissao e filtros permanecem compativeis com os tipos Prisma e DTOs atuais.

## Conclusao

A suite `club-prompts-detail.routes.test.ts` passou com sucesso e valida o detalhe de prompt com respostas ativas, permissao de resposta e isolamento de acesso corrigidos.
