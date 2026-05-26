## Arquivos testados

```text
backend/tests/notifications.service.test.ts
backend/tests/notifications.routes.test.ts
backend/tests/clubs.notifications.routes.test.ts
backend/tests/clubs.notifications-final-regression.routes.test.ts
backend/tests/truths.service.test.ts
backend/tests/dares.service.test.ts
backend/tests/truth-likes.routes.test.ts
backend/tests/dare-likes.routes.test.ts
backend/tests/truth-comments.routes.test.ts
backend/tests/proofs.routes.test.ts
backend/tests/password-reset.routes.test.ts
```

## Escopo do relatorio

Regressao backend da inbox de notificacoes persistentes, cobrindo leitura, contagem, marcacao de leitura, produtores reais de Clubes, produtores reais de Feed e evento real de Conta.

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
npm test -- --runInBand tests/notifications.service.test.ts tests/notifications.routes.test.ts tests/clubs.notifications.routes.test.ts tests/clubs.notifications-final-regression.routes.test.ts tests/truths.service.test.ts tests/dares.service.test.ts tests/truth-likes.routes.test.ts tests/dare-likes.routes.test.ts tests/truth-comments.routes.test.ts tests/proofs.routes.test.ts tests/password-reset.routes.test.ts
```

Resultado:

```text
PASS tests/truth-comments.routes.test.ts
PASS tests/password-reset.routes.test.ts
PASS tests/notifications.routes.test.ts
PASS tests/proofs.routes.test.ts
PASS tests/clubs.notifications.routes.test.ts
PASS tests/notifications.service.test.ts
PASS tests/truths.service.test.ts
PASS tests/truth-likes.routes.test.ts
PASS tests/dare-likes.routes.test.ts
PASS tests/clubs.notifications-final-regression.routes.test.ts
PASS tests/dares.service.test.ts

Test Suites: 11 passed, 11 total
Tests:       111 passed, 111 total
Snapshots:   0 total
Time:        53.804 s
```

## Validacao complementar

Comando executado em `backend/`:

```bash
npx tsc --noEmit
```

Resultado:

```text
Comando concluido sem erros.
```

## Cenarios validados

- Criacao persistente de notificacao.
- Supressao de self-notification quando `actorId` e `userId` sao iguais.
- Idempotencia por `dedupeKey`.
- Listagem restrita ao usuario autenticado.
- Inbox contendo notificacoes com `clubId` e sem `clubId`.
- Inbox contendo eventos reais de Clubes, Feed e Conta para o mesmo usuario autenticado.
- `/notifications` retornando eventos de dominios diferentes na mesma resposta.
- `unread-count` contando notificacoes de qualquer dominio.
- Leitura individual de notificacao de Feed sem exigir clube.
- Leitura em massa de notificacoes restantes de Clubes e Conta.
- Bloqueio ao tentar marcar notificacao de outro usuario.
- Autenticacao obrigatoria nas rotas de notificacoes.
- Produtores reais de Clubes: convites, aceite, solicitacoes, prompts, respostas, comentarios, mencoes e promocao.
- Produtores reais de Feed: truth recebida, dare recebido, comentario em truth, likes e prova de dare.
- Evento real de Conta: redefinicao de senha concluida.
- Preservacao dos testes focados de dedupe, self-notification guard, referencias e deep links dos produtores.

## Interpretacao

A execucao confirma que a tabela `Notification` e a API `/notifications` funcionam como uma inbox unica por usuario autenticado. Eventos de Clubes, Feed e Conta aparecem juntos sem criar endpoint paralelo, filtro obrigatorio por origem ou dependencia de `clubId`.

As suites tambem confirmam que os produtores reais continuam usando `createNotification`, com destinatario claro, `referenceType`, `referenceId`, `deepLink` e `dedupeKey` estavel quando aplicavel.

## Validacao manual

Nao houve validacao manual no app mobile, navegador, Prisma Studio ou cliente HTTP.

## Conclusao

A regressao backend passou. A inbox de notificacoes permanece consolidada para eventos de Clubes, Feed e Conta, com contagem de nao lidas, leitura individual e leitura em massa funcionando para notificacoes de qualquer dominio.
