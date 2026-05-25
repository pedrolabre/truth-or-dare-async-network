## Arquivos testados

```text
backend/tests/notifications.service.test.ts
backend/tests/notifications.routes.test.ts
```

## Escopo do relatorio

Validacao do backend de notificacoes como inbox unica, cobrindo listagem, contagem de nao lidas, leitura individual e leitura em massa com notificacoes do usuario autenticado que possuem `clubId` e tambem notificacoes sem `clubId`, diferenciadas por `referenceType` sem criar novos `NotificationType`.

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
npm test -- --runInBand tests/notifications.service.test.ts tests/notifications.routes.test.ts
```

Resultado:

```text
> backend@1.0.0 test
> jest --runInBand tests/notifications.service.test.ts tests/notifications.routes.test.ts

PASS tests/notifications.service.test.ts (6.481 s)
PASS tests/notifications.routes.test.ts

Test Suites: 2 passed, 2 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        10.15 s
Ran all test suites matching /tests\\notifications.service.test.ts|tests\\notifications.routes.test.ts/i.
```

## Cenarios validados

- Criacao de notificacao persistente.
- Supressao de notificacao quando `actorId === userId`.
- Idempotencia por `dedupeKey`.
- Listagem restrita ao usuario autenticado.
- Listagem de inbox unica contendo notificacao com `clubId` e notificacao sem `clubId`.
- Filtro `read=false` preservando notificacoes de mais de uma origem representada por `referenceType`.
- Contagem de nao lidas sem filtro por Clube.
- Marcacao individual de leitura para notificacao sem `clubId`.
- Marcacao geral de leitura para notificacoes com e sem `clubId`.
- Bloqueio ao tentar marcar notificacao de outro usuario.
- Autenticacao obrigatoria nas rotas de notificacoes.
- Isolamento de notificacoes de outro usuario.

## Interpretacao

A execucao confirma que a implementacao atual de `/notifications`, `/notifications/unread-count`, `PATCH /notifications/:id/read` e `POST /notifications/read-all` opera sobre a tabela `Notification` por usuario autenticado, sem depender de `clubId` ou de uma origem especifica.

As regressoes adicionadas usam somente tipos existentes no enum `NotificationType` e simulam a origem por campos opcionais ja existentes (`clubId`, `referenceType`, `referenceId` e `deepLink`). Assim, a cobertura prova a inbox unica sem adicionar tipos `feed_*` ou `account_*`, sem migration e sem produtor novo.

## Validacao manual

Nao houve validacao manual no app mobile, navegador, Prisma Studio ou cliente HTTP.

## Conclusao

As suites de notificacoes passaram. O backend de leitura, contagem e marcacao de leitura permanece consolidado como inbox unica para todas as notificacoes do usuario autenticado.
