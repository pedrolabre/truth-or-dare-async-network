## Arquivo testado

`backend/tests/clubs.members-mute.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre os endpoints de silencio de notificacoes de clubes:

1. `POST /clubs/:id/mute`
2. `POST /clubs/:id/unmute`
3. Atualizacao de `ClubMember.mutedUntil` para membros ativos.
4. Bloqueios para usuarios sem membership ativa.
5. Registro de audit log para as acoes de silenciar e remover silencio.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members-mute.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members-mute.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 22 passed, 22 total
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

## Cenarios validados

1. `POST /clubs/:id/mute` permite owner ativo silenciar o clube.
2. `POST /clubs/:id/mute` permite admin ativo silenciar o clube.
3. `POST /clubs/:id/mute` permite moderator ativo silenciar o clube.
4. `POST /clubs/:id/mute` permite member ativo silenciar o clube.
5. A resposta retorna `ClubMemberSummaryDto` com `mutedUntil` preenchido.
6. A membership persiste `mutedUntil` com ano UTC 9999.
7. A acao registra audit log `club_member_muted`.
8. Membership `invited` nao pode silenciar o clube.
9. Membership `requested` nao pode silenciar o clube.
10. Membership `removed` nao pode silenciar o clube.
11. Outsider nao pode silenciar o clube.
12. Clube arquivado bloqueia silencio.
13. Clube suspenso bloqueia silencio.
14. Clube deletado retorna `CLUB_NOT_FOUND`.
15. Requisicao sem token retorna `401`.
16. `POST /clubs/:id/unmute` permite owner ativo remover silencio do clube.
17. `POST /clubs/:id/unmute` permite admin ativo remover silencio do clube.
18. `POST /clubs/:id/unmute` permite moderator ativo remover silencio do clube.
19. `POST /clubs/:id/unmute` permite member ativo remover silencio do clube.
20. A resposta de unmute retorna `ClubMemberSummaryDto` com `mutedUntil` nulo.
21. A membership persiste `mutedUntil` nulo.
22. A acao registra audit log `club_member_unmuted`.
23. Membership `invited` nao pode remover silencio do clube.
24. Membership `requested` nao pode remover silencio do clube.
25. Membership `removed` nao pode remover silencio do clube.
26. Outsider nao pode remover silencio do clube.
27. Clube arquivado bloqueia remocao de silencio.
28. Clube suspenso bloqueia remocao de silencio.
29. Clube deletado retorna `CLUB_NOT_FOUND`.
30. Requisicao sem token retorna `401`.

## Interpretacao

Os endpoints foram validados com sucesso. A funcionalidade permite que qualquer membro ativo silencie notificacoes do clube, remova esse silencio, grave a preferencia na propria membership e registre as acoes sensiveis em audit log.

Os cenarios negativos confirmam que usuarios sem membership ativa nao conseguem alterar preferencias de notificacao do clube.

## Conclusao

O fluxo de silencio e remocao de silencio de notificacoes de clube esta pronto para ser usado por clientes autenticados e preserva rastreabilidade por audit log.
