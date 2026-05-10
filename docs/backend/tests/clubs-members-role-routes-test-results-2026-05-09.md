## Arquivo testado

`backend/tests/clubs.members-role.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre o endpoint de promocao e rebaixamento de membros de clubes:

1. `PATCH /clubs/:id/members/:userId/role`
2. Promocao e rebaixamento de membros.
3. Bloqueio de alteracao de ownership por esta rota.
4. Hierarquia de permissoes e audit log.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members-role.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members-role.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 19 passed, 19 total
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
npm test -- --runInBand tests/clubs.members-remove.routes.test.ts
npm test -- --runInBand tests/clubs.members-leave.routes.test.ts
npm test -- --runInBand tests/clubs.members.routes.test.ts
```

Resultados:

```text
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

Observacao: uma tentativa inicial de rodar duas suites de integracao em paralelo gerou colisao no banco compartilhado porque ambas executam reset. As suites foram reexecutadas sequencialmente, que e o modo valido para esses testes.

## Cenarios validados

1. Owner promove member para admin.
2. Owner promove member para moderator.
3. Owner rebaixa admin para member.
4. Owner rebaixa moderator para member.
5. Admin promove member para moderator.
6. Admin rebaixa moderator para member.
7. Admin nao promove member para admin.
8. Admin nao altera admin.
9. Admin nao altera owner.
10. Moderator nao altera member.
11. Member nao altera member.
12. Role `owner` e bloqueado.
13. Role invalido e bloqueado.
14. Autoalteracao e bloqueada.
15. Papel igual ao atual e bloqueado.
16. Alvo `invited` e bloqueado.
17. Alvo `requested` e bloqueado.
18. Alvo `removed` e bloqueado.
19. Clube arquivado bloqueia alteracao.
20. Clube suspenso bloqueia alteracao.
21. Clube deletado retorna `CLUB_NOT_FOUND`.
22. Requisicao sem token retorna `401`.

## Interpretacao

O endpoint foi validado com sucesso. Ele permite promocao e rebaixamento sem transferir ownership, respeitando a hierarquia owner > admin > moderator > member e bloqueando explicitamente `owner` como role de entrada.

O audit log `club_member_role_updated` cobre promocao e rebaixamento com `previousRole` e `newRole`, deixando a transferencia de posse restrita ao endpoint dedicado.

## Conclusao

O fluxo de alteracao de papel esta pronto e preserva a fronteira de seguranca: ownership nao muda por patch de role, apenas pelo endpoint dedicado de transferencia.
