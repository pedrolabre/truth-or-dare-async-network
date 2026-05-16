## Arquivo testado

`backend/tests/feed-club-items.service.test.ts`

## Escopo do relatorio

Validacao do servico de projecao de prompts de clube no feed geral, incluindo contrato do item projetado, uso de contadores persistidos, alvo correto de like, ausencia de usuario autenticado, permissoes de leitura, disponibilidade de clubes e prompts, expiracao e limite interno da projecao.

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
PASS tests/feed-club-items.service.test.ts (5.454 s)
  getFeedClubItems
    √ projeta prompts publicados com contrato contadores persistidos e like club_prompt (1373 ms)
    √ retorna vazio quando nao ha usuario autenticado (579 ms)
    √ respeita visibilidade membership ativa e prompts members only (459 ms)
    √ oculta clubes indisponiveis prompts indisponiveis e prompts expirados (1806 ms)
    √ limita a projecao a dez prompts de clube preservando publicacao recente (315 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        5.627 s, estimated 9 s
Ran all test suites matching /tests\\feed-club-items.service.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 890ms

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Projecao de prompts publicados como itens `club` do feed geral.
- Preservacao do contrato publico do item projetado com `id`, `type`, `clubName`, `badge`, `quote`, `answersCount`, `likesCount` e `likedByMe`.
- Preservacao de `badge` como `Verdade` para prompt de verdade.
- Preservacao de `badge` como `Desafio` para prompt de desafio.
- Uso de `ClubPrompt.answersCount` como contador persistido de respostas.
- Uso de `ClubPrompt.likesCount` como contador persistido de curtidas.
- Calculo de `likedByMe` com alvo `LikeTargetType.club_prompt`.
- Ignorar curtida com alvo `LikeTargetType.club` quando o item representa prompt de clube.
- Retorno vazio quando nao ha usuario autenticado para avaliar permissao de leitura.
- Bloqueio de qualquer projecao de clube em chamada sem `userId`.
- Visualizacao de prompt publico por outsider quando `isMembersOnly` e `false`.
- Bloqueio de prompt publico `members only` para outsider.
- Bloqueio de prompt de clube privado para outsider.
- Bloqueio de prompt de clube invite_only para outsider.
- Visualizacao de prompt de clube privado por membro ativo.
- Visualizacao de prompt de clube invite_only por membro ativo.
- Bloqueio de prompt para membership removida, mesmo quando o clube e publico.
- Ocultacao de clube arquivado.
- Ocultacao de clube suspenso.
- Ocultacao de clube deletado.
- Ocultacao de clube soft deleted.
- Ocultacao de prompt em draft.
- Ocultacao de prompt arquivado por status.
- Ocultacao de prompt removido por status.
- Ocultacao de prompt publicado com `archivedAt`.
- Ocultacao de prompt publicado com `removedAt`.
- Ocultacao de prompt expirado.
- Limite de dez itens de clube projetados.
- Preservacao da ordenacao por publicacao mais recente dentro da projecao.
- Exclusao de prompt antigo quando o limite de itens projetados e atingido.
- Validacao sem alteracao de schema Prisma.
- Validacao sem consultar ou projetar respostas de clube.
- Validacao sem recalcular artificialmente curtidas ou respostas.

## Interpretacao

A suite demonstra que a projecao de clubes no feed geral foi isolada como uma transformacao controlada de `ClubPrompt` para o contrato atual de `FeedItem` do tipo `club`. O item projetado continua pequeno e compativel com o consumidor atual, mas passa a usar os contadores persistidos do prompt e o alvo especifico `club_prompt` para o estado de curtida.

Os cenarios de permissao validam que o feed geral nao vira uma rota alternativa para acessar conteudo de clube. Usuario sem identificacao nao recebe itens de clube, outsider so recebe prompt publico explicitamente nao restrito a membros, e memberships removidas bloqueiam a projecao mesmo quando o clube e publico. Isso preserva a separacao entre a timeline global e as regras de leitura do dominio de clubes.

Os cenarios de disponibilidade confirmam que clubes arquivados, suspensos, deletados ou soft deleted nao geram itens no feed geral, e que prompts em draft, arquivados, removidos, marcados com `archivedAt`, marcados com `removedAt` ou expirados tambem ficam fora da projecao. O limite de dez itens e a ordenacao por publicacao recente mantem a superficie do feed previsivel sem introduzir ranking externo, recomendacao ou dependencia de respostas.

Como a suite foi executada com banco resetado e o build TypeScript foi concluido, o comportamento foi validado contra Prisma, PostgreSQL e os tipos atuais sem necessidade de alteracao de schema.

## Conclusao

A suite `feed-club-items.service.test.ts` valida com sucesso a projecao segura de prompts de clube no feed geral, com contadores reais, alvo correto de like, filtros de permissao e build TypeScript concluido sem erros.
