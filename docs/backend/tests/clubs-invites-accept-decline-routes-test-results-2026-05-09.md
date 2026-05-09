## Arquivo testado

`backend/tests/clubs.invites.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenarios validados

1. `POST /clubs/invites/:id/accept` permite o convidado aceitar convite pendente
2. `POST /clubs/invites/:id/accept` atualiza o convite para `status = active`
3. `POST /clubs/invites/:id/accept` preenche `acceptedAt`
4. `POST /clubs/invites/:id/accept` ativa a membership do convidado
5. `POST /clubs/invites/:id/accept` incrementa `memberCount`
6. `POST /clubs/invites/:id/accept` atualiza `lastActivityAt`
7. `POST /clubs/invites/:id/accept` registra audit log `club_invite_accepted`
8. `POST /clubs/invites/:id/accept` bloqueia usuario diferente do convidado
9. `POST /clubs/invites/:id/accept` rejeita convite inexistente
10. `POST /clubs/invites/:id/accept` rejeita convite nao pendente
11. `POST /clubs/invites/:id/accept` rejeita convite de clube arquivado
12. `POST /clubs/invites/:id/accept` retorna `401` sem token
13. `POST /clubs/invites/:id/decline` permite o convidado recusar convite pendente
14. `POST /clubs/invites/:id/decline` atualiza o convite para `status = removed`
15. `POST /clubs/invites/:id/decline` preenche `declinedAt`
16. `POST /clubs/invites/:id/decline` atualiza membership `invited` para `removed`
17. `POST /clubs/invites/:id/decline` preserva `memberCount`
18. `POST /clubs/invites/:id/decline` registra audit log `club_invite_declined`
19. `POST /clubs/invites/:id/decline` bloqueia usuario diferente do convidado
20. `POST /clubs/invites/:id/decline` rejeita convite inexistente
21. `POST /clubs/invites/:id/decline` rejeita convite nao pendente
22. `POST /clubs/invites/:id/decline` rejeita convite de clube deletado
23. `POST /clubs/invites/:id/decline` permite recusar convite de clube arquivado
24. `POST /clubs/invites/:id/decline` retorna `401` sem token

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
  passou POST /clubs/invites/:id/accept permite convidado aceitar convite pendente
  passou POST /clubs/invites/:id/accept bloqueia usuario diferente do convidado
  passou POST /clubs/invites/:id/accept rejeita convite inexistente, nao pendente e clube arquivado
  passou POST /clubs/invites/:id/accept retorna 401 sem token
  passou POST /clubs/invites/:id/decline permite convidado recusar convite pendente
  passou POST /clubs/invites/:id/decline bloqueia usuario diferente do convidado
  passou POST /clubs/invites/:id/decline rejeita convite inexistente, nao pendente e clube deletado
  passou POST /clubs/invites/:id/decline permite recusar convite de clube arquivado
  passou POST /clubs/invites/:id/decline retorna 401 sem token

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
```

## Validacao adicional

O build do backend passou:

```text
npm run build
Build TypeScript/Prisma: passou
```

A suite principal de rotas de clubes tambem foi reexecutada para validar que as novas rotas de aceite e recusa nao quebraram o CRUD inicial:

```text
PASS tests/clubs.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 6 passed, 6 total
```

## Interpretacao

Os testes confirmam que o convidado pode aceitar convite pendente, que o convite passa para `active`, que a membership vira ativa, que `memberCount` e `lastActivityAt` sao atualizados e que o audit log `club_invite_accepted` e registrado.

Tambem confirmam que usuarios diferentes do convidado nao podem aceitar o convite, que convites inexistentes ou nao pendentes sao rejeitados e que clubes arquivados nao aceitam entrada por convite.

Os testes de recusa confirmam que o convidado pode recusar convite pendente, que o convite passa para `removed`, que a membership pendente tambem vira `removed`, que `memberCount` nao muda e que o audit log `club_invite_declined` e registrado.

Tambem confirmam que usuarios diferentes do convidado nao podem recusar o convite, que convites inexistentes ou nao pendentes sao rejeitados, que clubes deletados nao permitem recusa e que clubes arquivados ainda permitem recusa para limpar o convite pendente do usuario.

Observacao: a suite tem 17 testes, mas valida mais cenarios porque alguns testes fazem multiplas assercoes de persistencia e contrato no mesmo fluxo. O teste de aceite valida resposta HTTP, mudanca de convite, membership ativa, contador, atividade e audit log. O teste de recusa valida resposta HTTP, mudanca de convite, membership removida, contador preservado e audit log.

## Conclusao

A suite valida com sucesso os contratos HTTP de `POST /clubs/invites/:id/accept` e `POST /clubs/invites/:id/decline`, incluindo autorizacao, validacoes principais, persistencia de convite/membership, audit log, aceite e recusa de convite pendente.
