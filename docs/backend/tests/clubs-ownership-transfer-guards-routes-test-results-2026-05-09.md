## Arquivo testado

`backend/tests/clubs.ownership-transfer-guards.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre os cenarios de bloqueio do endpoint de transferencia de posse de clubes:

1. `POST /clubs/:id/transfer-ownership`
2. Bloqueios por papel do actor.
3. Bloqueios por status do novo owner.
4. Bloqueios por status do clube, payload invalido e autenticacao ausente.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.ownership-transfer-guards.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.ownership-transfer-guards.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 11 passed, 11 total
Snapshots: 0 total
```

## Validacao adicional

Comando executado em `backend/`:

```bash
npm run build
```

Resultado:

```text
Build TypeScript/Prisma: passou
```

Comandos de regressao executados em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members-role.routes.test.ts
npm test -- --runInBand tests/clubs.members-remove.routes.test.ts
npm test -- --runInBand tests/clubs.members-leave.routes.test.ts
npm test -- --runInBand tests/clubs.members.routes.test.ts
```

Resultados:

```text
PASS tests/clubs.members-role.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 19 passed, 19 total

PASS tests/clubs.members-remove.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 18 passed, 18 total

PASS tests/clubs.members-leave.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 11 passed, 11 total

PASS tests/clubs.members.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 31 passed, 31 total
```

Observacao: as suites de integracao com banco compartilhado foram executadas sequencialmente. Execucao paralela pode colidir porque cada suite reseta o banco de teste.

## Cenarios validados

1. Admin nao transfere posse.
2. Moderator nao transfere posse.
3. Member nao transfere posse.
4. Outsider nao transfere posse.
5. Owner nao transfere posse para outsider.
6. Novo owner `invited` e bloqueado.
7. Novo owner `requested` e bloqueado.
8. Novo owner `removed` e bloqueado.
9. Transferencia para si mesmo e bloqueada.
10. Payload sem `newOwnerId` e bloqueado.
11. Clube arquivado bloqueia transferencia.
12. Clube suspenso bloqueia transferencia.
13. Clube deletado retorna `CLUB_NOT_FOUND`.
14. Requisicao sem token retorna `401`.

## Interpretacao

Os testes de guarda confirmam que apenas owner ativo pode transferir posse e que o novo owner precisa ser membro ativo do clube.

Tambem confirmam que a rota rejeita estados de clube que nao aceitam administracao ativa, preservando `CLUB_NOT_FOUND` para clube deletado e `CLUB_VALIDATION_ERROR` para archived/suspended.

## Conclusao

As protecoes do endpoint de transferencia de ownership foram validadas com sucesso. O endpoint nao permite transferencia por papeis inadequados, para usuarios fora do clube ou para memberships nao ativas.
