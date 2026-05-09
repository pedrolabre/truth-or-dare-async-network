## Arquivo testado

`backend/tests/clubs.invites.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenarios validados

1. `POST /clubs/:id/invites` permite owner convidar usuario existente
2. `POST /clubs/:id/invites` permite admin convidar usuario existente
3. `POST /clubs/:id/invites` bloqueia membro comum
4. `POST /clubs/:id/invites` retorna `CLUB_FORBIDDEN` para membro comum
5. `POST /clubs/:id/invites` rejeita usuario ja ativo
6. `POST /clubs/:id/invites` rejeita convite pendente duplicado
7. `POST /clubs/:id/invites` cria `ClubInvite` com `status = invited`
8. `POST /clubs/:id/invites` cria ou atualiza membership com `status = invited`
9. `POST /clubs/:id/invites` preenche `invitedById`
10. `POST /clubs/:id/invites` mantem `joinedAt = null` para convidado pendente
11. `POST /clubs/:id/invites` registra audit log `club_invite_created`
12. `POST /clubs/:id/invites` nao incrementa `memberCount`
13. `POST /clubs/:id/invites` retorna `401` sem token
14. `GET /clubs/invites/my` lista apenas convites recebidos pelo usuario autenticado
15. `GET /clubs/invites/my` nao lista convites recebidos por outro usuario
16. `GET /clubs/invites/my` inclui dados basicos do clube
17. `GET /clubs/invites/my` inclui dados basicos do inviter
18. `GET /clubs/invites/my` nao lista convites de clube deletado
19. `GET /clubs/invites/my` retorna lista vazia quando nao ha convites
20. `GET /clubs/invites/my` retorna `401` sem token

## Resultado da execucao

PASS  tests/clubs.invites.routes.test.ts

```text
clubs.invites.routes
  passou POST /clubs/:id/invites permite owner convidar usuario existente
  passou POST /clubs/:id/invites permite admin convidar usuario
  passou POST /clubs/:id/invites bloqueia membro comum
  passou POST /clubs/:id/invites rejeita usuario ja ativo e convite pendente duplicado
  passou POST /clubs/:id/invites retorna 401 sem token
  passou GET /clubs/invites/my lista apenas convites recebidos pelo usuario autenticado
  passou GET /clubs/invites/my nao lista convites de clube deletado e retorna vazio quando nao ha convites
  passou GET /clubs/invites/my retorna 401 sem token

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
```

## Validacao adicional

O build do backend passou:

```text
npm run build
Build TypeScript/Prisma: passou
```

A suite de membros tambem foi reexecutada para garantir que a nova rota parametrizada nao causou regressao:

```text
PASS tests/clubs.members.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 4 passed, 4 total
```

## Interpretacao

Os testes confirmam que o endpoint de convite direto respeita autorizacao de owner/admin, bloqueia membro comum, cria os registros corretos e preserva `memberCount` ate o convite ser aceito.

Tambem confirmam que convite pendente nao e duplicado e que usuario ja ativo nao pode ser convidado novamente.

A expansao da suite tambem confirma que `GET /clubs/invites/my` retorna somente convites pendentes recebidos pelo usuario autenticado, inclui dados basicos de clube e inviter, ignora clubes deletados e retorna lista vazia quando nao ha convites.

Observacao: a suite tem 8 testes, mas valida mais cenarios porque alguns testes fazem multiplas assercoes de persistencia e contrato no mesmo fluxo. O teste de criacao por owner, por exemplo, valida resposta HTTP, `ClubInvite`, `ClubMember`, audit log e preservacao de `memberCount`.

## Conclusao

A suite valida com sucesso os contratos HTTP de `POST /clubs/:id/invites` e `GET /clubs/invites/my`, incluindo autorizacao, validacoes principais, persistencia de convite/membership, audit log e listagem de convites recebidos.
