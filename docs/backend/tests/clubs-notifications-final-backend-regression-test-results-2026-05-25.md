## Arquivos testados

```text
backend/tests/notifications.service.test.ts
backend/tests/notifications.routes.test.ts
backend/tests/clubs.notifications.routes.test.ts
backend/tests/clubs.notifications-final-regression.routes.test.ts
backend/tests/populate-club-notifications.test.ts
backend/tests/club-feed-seen.routes.test.ts
backend/tests/clubs.routes.test.ts
backend/tests/clubs.invites.routes.test.ts
backend/tests/clubs.members.routes.test.ts
backend/tests/clubs.members-role.routes.test.ts
backend/tests/club-prompts.routes.test.ts
backend/tests/club-prompt-responses.routes.test.ts
backend/tests/club-prompt-comments.routes.test.ts
backend/tests/club-feed.routes.test.ts
backend/tests/club-reports.routes.test.ts
backend/tests/clubs.moderation-final-regression.routes.test.ts
backend/tests/clubs.security-quality.routes.test.ts
```

## Escopo do relatorio

Regressao backend final cobrindo notificacoes persistentes, Clubes, convites, requests, prompts, respostas, comentarios, feed, reports, moderacao, seguranca e seed denso.

Data da execucao: 25/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- ts-jest
- Prisma
- PostgreSQL
- dotenv

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/notifications.service.test.ts tests/notifications.routes.test.ts tests/clubs.notifications.routes.test.ts tests/clubs.notifications-final-regression.routes.test.ts tests/populate-club-notifications.test.ts tests/club-feed-seen.routes.test.ts tests/clubs.routes.test.ts tests/clubs.invites.routes.test.ts tests/clubs.members.routes.test.ts tests/clubs.members-role.routes.test.ts tests/club-prompts.routes.test.ts tests/club-prompt-responses.routes.test.ts tests/club-prompt-comments.routes.test.ts tests/club-feed.routes.test.ts tests/club-reports.routes.test.ts tests/clubs.moderation-final-regression.routes.test.ts tests/clubs.security-quality.routes.test.ts
```

Resultado:

```text
> backend@1.0.0 test
> jest --runInBand tests/notifications.service.test.ts tests/notifications.routes.test.ts tests/clubs.notifications.routes.test.ts tests/clubs.notifications-final-regression.routes.test.ts tests/populate-club-notifications.test.ts tests/club-feed-seen.routes.test.ts tests/clubs.routes.test.ts tests/clubs.invites.routes.test.ts tests/clubs.members.routes.test.ts tests/clubs.members-role.routes.test.ts tests/club-prompts.routes.test.ts tests/club-prompt-responses.routes.test.ts tests/club-prompt-comments.routes.test.ts tests/club-feed.routes.test.ts tests/club-reports.routes.test.ts tests/clubs.moderation-final-regression.routes.test.ts tests/clubs.security-quality.routes.test.ts

PASS tests/clubs.members.routes.test.ts (9.348 s)
PASS tests/club-prompt-responses.routes.test.ts (5.677 s)
PASS tests/clubs.notifications.routes.test.ts
PASS tests/clubs.members-role.routes.test.ts
PASS tests/notifications.routes.test.ts
PASS tests/clubs.invites.routes.test.ts
PASS tests/populate-club-notifications.test.ts
PASS tests/notifications.service.test.ts
PASS tests/club-feed.routes.test.ts
PASS tests/club-prompt-comments.routes.test.ts
PASS tests/clubs.security-quality.routes.test.ts (5.244 s)
PASS tests/club-feed-seen.routes.test.ts
PASS tests/clubs.notifications-final-regression.routes.test.ts
PASS tests/club-reports.routes.test.ts
PASS tests/clubs.moderation-final-regression.routes.test.ts
PASS tests/clubs.routes.test.ts
PASS tests/club-prompts.routes.test.ts

Test Suites: 17 passed, 17 total
Tests:       144 passed, 144 total
Snapshots:   0 total
Time:        62.936 s, estimated 103 s
Ran all test suites matching /tests\\notifications.service.test.ts|tests\\notifications.routes.test.ts|tests\\clubs.notifications.routes.test.ts|tests\\clubs.notifications-final-regression.routes.test.ts|tests\\populate-club-notifications.test.ts|tests\\club-feed-seen.routes.test.ts|tests\\clubs.routes.test.ts|tests\\clubs.invites.routes.test.ts|tests\\clubs.members.routes.test.ts|tests\\clubs.members-role.routes.test.ts|tests\\club-prompts.routes.test.ts|tests\\club-prompt-responses.routes.test.ts|tests\\club-prompt-comments.routes.test.ts|tests\\club-feed.routes.test.ts|tests\\club-reports.routes.test.ts|tests\\clubs.moderation-final-regression.routes.test.ts|tests\\clubs.security-quality.routes.test.ts/i.
```

## Cenarios validados

- Notificacoes persistentes: criacao, deduplicacao, listagem, contagem, leitura individual, leitura em massa e autorizacao.
- Produtores reais de Clubes: convites, aceite, requests, aprovacao/rejeicao, prompts, respostas, comentarios, mencoes e promocao.
- Supressao de notificacoes comuns quando clube esta mutado.
- Feed visto, `lastSeenAt`, `unreadCount`, `mutedUntil` e `isMuted`.
- CRUD/listagem/detalhe de Clubes.
- Convites, membros e alteracao de papeis.
- Prompts, respostas e comentarios.
- Feed interno e agregado de Clubes.
- Reports, moderacao e seguranca.
- Seed denso de Clubes e notificacoes.

## Interpretacao

A regressao confirma que as alteracoes recentes nao alteraram os contratos HTTP principais de Clubes, notificacoes persistentes, feed, moderacao e seguranca.

As suites tambem confirmam que a nova cobertura final e o seed denso convivem com as suites existentes, mantendo mute, contadores, `feed/seen`, permissao de membership e protecoes de moderacao.

## Validacao manual

Nao houve validacao manual no app mobile, navegador, Prisma Studio ou cliente HTTP.

## Conclusao

A regressao backend final passou. Os fluxos principais de Clubes e notificacoes persistentes seguem funcionando sem push real, Expo Notifications, realtime, websocket, novo canal de notificacao ou alteracao de schema Prisma.
