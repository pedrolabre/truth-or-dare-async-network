## Arquivo testado

`backend/tests/feed-club-items.service.test.ts`

## Escopo do relatorio

Validacao da projecao segura de prompts de clube para o feed geral, incluindo contrato mobile atual, contadores persistidos, likes de prompt, visibilidade de clube, membership, prompts `members only`, expiracao e limite de itens.

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
> backend@1.0.0 test
> jest --runInBand tests/feed-club-items.service.test.ts

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
PASS tests/feed-club-items.service.test.ts (9.352 s)
  getFeedClubItems
    √ projeta prompts publicados com contrato contadores persistidos e like club_prompt (1280 ms)
    √ retorna vazio quando nao ha usuario autenticado (472 ms)
    √ respeita visibilidade membership ativa e prompts members only (542 ms)
    √ oculta clubes indisponiveis prompts indisponiveis e prompts expirados (1968 ms)
    √ limita a projecao a dez prompts de clube preservando publicacao recente (458 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        9.662 s
Ran all test suites matching /tests\\feed-club-items.service.test.ts/i.
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

- Projecao de prompts publicados no contrato `type: club`.
- Retorno de `id`, `clubName`, `badge`, `quote`, `answersCount`, `likesCount` e `likedByMe`.
- Uso de `ClubPrompt.answersCount`.
- Uso de `ClubPrompt.likesCount`.
- `likedByMe` calculado somente por `LikeTargetType.club_prompt`.
- Ignorar `LikeTargetType.club` como like de prompt.
- Retorno vazio sem usuario autenticado.
- Projecao de prompt publico aberto para outsider.
- Ocultacao de prompt publico `members only` para outsider.
- Ocultacao de clube privado para outsider.
- Ocultacao de clube `invite_only` para outsider.
- Projecao de clube privado para membro ativo.
- Projecao de clube `invite_only` para membro ativo.
- Bloqueio de membership removida.
- Ocultacao de clube arquivado, suspenso, deletado e soft deleted.
- Ocultacao de prompt draft, arquivado, removido, com `archivedAt`, com `removedAt` ou expirado.
- Limite de dez itens projetados.
- Preservacao de publicacao mais recente dentro do limite.

## Interpretacao

O service de projecao e a fronteira entre o dominio de clubes e o feed geral. A suite confirma que essa fronteira continua estreita: o feed geral recebe apenas prompts de clube projetaveis e no shape esperado pelo mobile atual, sem absorver respostas, comentarios ou regras internas de clube.

A validacao de visibilidade mostra que membership ativa amplia o acesso, enquanto outsider recebe apenas prompts publicos nao `members only`. A verificacao de `LikeTargetType.club_prompt` impede regressao para o comportamento antigo em que `club` poderia ser confundido com prompt.

O filtro de expiracao protege o feed geral de mostrar uma atividade sem estado suficiente para explicar que a interacao esta bloqueada. A validacao de limite evita crescimento inesperado do feed geral por atividades de clube.

## Conclusao

A suite `feed-club-items.service.test.ts` passou com sucesso e valida a projecao de prompts de clube no feed geral com contadores reais e regras de leitura preservadas.
