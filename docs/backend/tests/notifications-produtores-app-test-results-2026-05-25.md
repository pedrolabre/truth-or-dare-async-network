## Arquivos testados

```text
backend/tests/notifications.service.test.ts
backend/tests/notifications.routes.test.ts
backend/tests/truths.service.test.ts
backend/tests/dares.service.test.ts
backend/tests/truth-likes.routes.test.ts
backend/tests/dare-likes.routes.test.ts
backend/tests/truth-comments.routes.test.ts
backend/tests/proofs.routes.test.ts
backend/tests/password-reset.routes.test.ts
```

## Escopo do relatorio

Validacao dos produtores reais de notificacoes para Feed, Truths, Dares, Likes, prova de dare e redefinicao de senha conectados ao `createNotification`.

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
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/notifications.service.test.ts tests/notifications.routes.test.ts tests/truths.service.test.ts tests/dares.service.test.ts tests/truth-likes.routes.test.ts tests/dare-likes.routes.test.ts tests/truth-comments.routes.test.ts tests/proofs.routes.test.ts tests/password-reset.routes.test.ts
```

Resultado:

```text
PASS tests/truth-comments.routes.test.ts
PASS tests/notifications.service.test.ts
PASS tests/password-reset.routes.test.ts
PASS tests/notifications.routes.test.ts
PASS tests/proofs.routes.test.ts
PASS tests/dare-likes.routes.test.ts
PASS tests/truth-likes.routes.test.ts
PASS tests/truths.service.test.ts
PASS tests/dares.service.test.ts

Test Suites: 9 passed, 9 total
Tests:       103 passed, 103 total
Snapshots:   0 total
Time:        51.067 s
```

Observacao: a execucao resetou o banco de teste e aplicou a migration `20260525120000_add_app_notification_types` antes das suites.

## Validacoes complementares

Comando executado em `backend/`:

```bash
npx prisma validate
```

Resultado:

```text
The schema at prisma\schema.prisma is valid
```

Comando executado em `backend/`:

```bash
npx tsc --noEmit
```

Resultado:

```text
Comando concluido sem erros.
```

Depois de um ajuste sem mudanca comportamental no formato do `deepLink` de proof, tambem foram repetidos:

```bash
npx tsc --noEmit
npm test -- --runInBand tests/proofs.routes.test.ts
```

Resultado:

```text
PASS tests/proofs.routes.test.ts

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        7.773 s
```

## Cenarios validados

- `createTruth` cria notificacao `feed_truth_received` para o usuario alvo.
- `createTruth` suprime self-notification quando autor e alvo sao o mesmo usuario.
- `createTruthCommentService` cria notificacao `feed_truth_comment` para o autor da truth.
- `createDare` cria notificacao `feed_dare_received` para o usuario alvo.
- `createDare` suprime self-notification quando autor e alvo sao o mesmo usuario.
- Like em truth cria notificacao `feed_like` para o autor da truth.
- Like em dare cria notificacao `feed_like` para o autor do dare.
- Like em truth comment cria notificacao `feed_like` para o autor do comentario.
- `submitDareProofService` cria notificacao `feed_dare_proof_submitted` para o autor do dare.
- `resetPassword` cria notificacao `account_password_reset_completed` para o usuario da conta.
- `/notifications` continua listando notificacoes de Clubes, Feed e Conta na mesma inbox.
- `unread-count`, leitura individual e leitura em massa continuam funcionando para notificacoes sem `clubId`.
- `dedupeKey` fica estavel nos produtores novos e reaproveita a idempotencia de `createNotification`.

## Interpretacao

A execucao confirma que os eventos reais validados usam a tabela `Notification` e o service unico `createNotification`, sem criar caixa paralela de Feed ou Conta.

Os produtores novos possuem destinatario claro, ator quando aplicavel, `referenceType`, `referenceId`, `deepLink` interno existente e `dedupeKey` estavel. A supressao de self-notification permanece centralizada em `createNotification`.

## Validacao manual

Nao houve validacao manual no app mobile, navegador, Prisma Studio ou cliente HTTP.

## Conclusao

As suites focadas passaram e validam os produtores reais de notificacoes. O schema Prisma tambem foi validado e o TypeScript do backend compilou sem erros com os novos `NotificationType`.
