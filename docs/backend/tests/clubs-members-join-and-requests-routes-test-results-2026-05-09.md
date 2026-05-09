## Arquivo testado

`backend/tests/clubs.members.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre o bloco de entrada e solicitacoes de membros de clubes:

1. `POST /clubs/:id/join`
2. `POST /clubs/:id/join-requests`
3. `POST /clubs/join-requests/:id/approve`
4. `POST /clubs/join-requests/:id/reject`

A suite executada tambem contem os cenarios de `GET /clubs/:id/members`, porque todos esses fluxos compartilham `backend/tests/clubs.members.routes.test.ts`.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 31 passed, 31 total
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

## Cenarios validados - entrada direta em clube publico

1. `POST /clubs/:id/join` permite outsider entrar em clube publico ativo.
2. `POST /clubs/:id/join` cria membership ativa para usuario sem membership previa.
3. `POST /clubs/:id/join` retorna a membership em formato `ClubMemberSummaryDto`.
4. `POST /clubs/:id/join` incrementa `memberCount`.
5. `POST /clubs/:id/join` atualiza `lastActivityAt`.
6. `POST /clubs/:id/join` registra audit log `club_joined`.
7. `POST /clubs/:id/join` reativa membership com status `invited`.
8. `POST /clubs/:id/join` reativa membership com status `requested`.
9. `POST /clubs/:id/join` reativa membership com status `removed`.
10. `POST /clubs/:id/join` rejeita usuario ja ativo.
11. `POST /clubs/:id/join` bloqueia clube privado.
12. `POST /clubs/:id/join` bloqueia clube invite-only.
13. `POST /clubs/:id/join` bloqueia clube arquivado.
14. `POST /clubs/:id/join` bloqueia clube suspenso.
15. `POST /clubs/:id/join` retorna `CLUB_NOT_FOUND` para clube deletado.
16. `POST /clubs/:id/join` retorna `401` sem token.

## Interpretacao - entrada direta

Os testes confirmam que a entrada direta e restrita a clubes publicos ativos, cria ou reativa membership, atualiza contador e atividade do clube e registra audit log.

Tambem confirmam que clubes privados ou invite-only devem usar outros fluxos, e que clubes arquivados, suspensos ou deletados nao aceitam entrada direta.

## Cenarios validados - solicitacao de entrada em clube privado

1. `POST /clubs/:id/join-requests` permite outsider solicitar entrada em clube privado ativo.
2. `POST /clubs/:id/join-requests` cria `ClubJoinRequest` com `status = requested`.
3. `POST /clubs/:id/join-requests` cria ou atualiza membership com `status = requested`.
4. `POST /clubs/:id/join-requests` preserva `joinedAt = null` na membership pendente.
5. `POST /clubs/:id/join-requests` nao incrementa `memberCount`.
6. `POST /clubs/:id/join-requests` registra audit log `club_join_requested`.
7. `POST /clubs/:id/join-requests` rejeita usuario ja ativo.
8. `POST /clubs/:id/join-requests` rejeita solicitacao pendente duplicada.
9. `POST /clubs/:id/join-requests` reaproveita solicitacao antiga rejeitada para nova tentativa.
10. `POST /clubs/:id/join-requests` reaproveita solicitacao antiga aprovada quando a membership ja nao esta ativa.
11. `POST /clubs/:id/join-requests` bloqueia clube publico.
12. `POST /clubs/:id/join-requests` bloqueia clube invite-only.
13. `POST /clubs/:id/join-requests` bloqueia clube arquivado.
14. `POST /clubs/:id/join-requests` bloqueia clube suspenso.
15. `POST /clubs/:id/join-requests` retorna `CLUB_NOT_FOUND` para clube deletado.
16. `POST /clubs/:id/join-requests` retorna `401` sem token.

## Interpretacao - solicitacao de entrada

Os testes confirmam que solicitacoes de entrada sao aceitas apenas em clubes privados ativos, criam request pendente, criam ou atualizam membership pendente, preservam contador e registram audit log.

Tambem confirmam que a regra de re-solicitacao reaproveita requests antigas `removed` ou `active` quando o usuario nao e membro ativo, limpando os campos de revisao antes de voltar para `requested`.

Essa regra evita conflito com o indice unico de `ClubJoinRequest` por `clubId`, `userId` e `status`, sem exigir alteracao de schema neste bloco.

## Cenarios validados - aprovacao de solicitacao

1. `POST /clubs/join-requests/:id/approve` permite owner aprovar solicitacao pendente.
2. `POST /clubs/join-requests/:id/approve` permite admin aprovar solicitacao pendente.
3. `POST /clubs/join-requests/:id/approve` ativa membership do solicitante.
4. `POST /clubs/join-requests/:id/approve` incrementa `memberCount`.
5. `POST /clubs/join-requests/:id/approve` atualiza `lastActivityAt`.
6. `POST /clubs/join-requests/:id/approve` registra audit log `club_join_request_approved`.
7. `POST /clubs/join-requests/:id/approve` bloqueia membro comum.
8. `POST /clubs/join-requests/:id/approve` bloqueia outsider.
9. `POST /clubs/join-requests/:id/approve` retorna `CLUB_NOT_FOUND` para solicitacao inexistente.
10. `POST /clubs/join-requests/:id/approve` rejeita solicitacao ja revisada.
11. `POST /clubs/join-requests/:id/approve` rejeita solicitacao de clube arquivado.
12. `POST /clubs/join-requests/:id/approve` retorna `401` sem token.
13. `POST /clubs/join-requests/:id/approve` permite aprovar novamente uma solicitacao antiga reaproveitada.

## Interpretacao - aprovacao

Os testes confirmam que owner e admin podem aprovar solicitacoes pendentes, enquanto membro comum e outsider recebem `CLUB_FORBIDDEN`.

A aprovacao ativa membership, incrementa contador quando aplicavel, atualiza atividade do clube, registra audit log e funciona tambem sobre requests antigas reaproveitadas pelo fluxo de nova solicitacao.

## Cenarios validados - rejeicao de solicitacao

1. `POST /clubs/join-requests/:id/reject` permite admin rejeitar solicitacao pendente.
2. `POST /clubs/join-requests/:id/reject` permite owner rejeitar solicitacao pendente.
3. `POST /clubs/join-requests/:id/reject` atualiza membership pendente para `removed`.
4. `POST /clubs/join-requests/:id/reject` preserva `memberCount`.
5. `POST /clubs/join-requests/:id/reject` registra audit log `club_join_request_rejected`.
6. `POST /clubs/join-requests/:id/reject` bloqueia membro comum.
7. `POST /clubs/join-requests/:id/reject` bloqueia outsider.
8. `POST /clubs/join-requests/:id/reject` retorna `CLUB_NOT_FOUND` para solicitacao inexistente.
9. `POST /clubs/join-requests/:id/reject` rejeita solicitacao ja revisada.
10. `POST /clubs/join-requests/:id/reject` rejeita solicitacao de clube suspenso.
11. `POST /clubs/join-requests/:id/reject` retorna `401` sem token.
12. `POST /clubs/join-requests/:id/reject` permite rejeitar novamente uma solicitacao antiga reaproveitada.

## Interpretacao - rejeicao

Os testes confirmam que owner e admin podem rejeitar solicitacoes pendentes, enquanto membro comum e outsider recebem `CLUB_FORBIDDEN`.

A rejeicao marca a request como `removed`, atualiza membership pendente para `removed` quando ela existe, preserva contador, registra audit log e funciona tambem sobre requests antigas reaproveitadas pelo fluxo de nova solicitacao.

## Conclusao

A suite valida com sucesso o bloco de entrada e solicitacoes de membros de clubes, incluindo entrada direta em clube publico, solicitacao de entrada em clube privado, aprovacao, rejeicao, permissoes, re-solicitacoes, contadores, atividade e audit logs.
