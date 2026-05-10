## Arquivo testado

`backend/tests/clubs.members-leave.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre o endpoint de saida voluntaria de membros de clubes:

1. `POST /clubs/:id/leave`
2. Bloqueio para owner sair sem transferir posse.
3. Atualizacao de membership, contador e audit log para saida de membro ativo.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members-leave.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members-leave.routes.test.ts
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

Comando de regressao executado em `backend/`:

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

## Cenarios validados

1. `POST /clubs/:id/leave` permite membro ativo sair do clube.
2. A saida atualiza `ClubMember.status` para `removed`.
3. A saida preserva o papel salvo da membership.
4. A saida decrementa `Club.memberCount`.
5. A saida registra audit log `club_member_left`.
6. Admin pode sair do clube.
7. Moderator pode sair do clube.
8. Owner nao pode sair sem transferir posse.
9. Memberships `invited`, `requested` e `removed` nao podem sair.
10. Outsider nao pode sair.
11. Membro ativo pode sair de clube arquivado.
12. Membro ativo pode sair de clube suspenso.
13. Clube deletado retorna `CLUB_NOT_FOUND`.
14. Requisicao sem token retorna `401`.

## Interpretacao

O endpoint foi validado com sucesso. Ele permite a saida voluntaria de membros ativos, preserva ownership, evita que o owner abandone o clube sem transferencia de posse, decrementa o contador quando aplicavel e registra audit log da acao sensivel.

A regressao em `clubs.members.routes.test.ts` confirma que a inclusao da rota `/:id/leave` nao quebrou listagem, entrada direta, solicitacao de entrada, aprovacao ou rejeicao de solicitacoes.

## Conclusao

O fluxo de saida de membros esta pronto para compor o bloco de moderacao e administracao de membros junto dos Itens 11, 12 e 13.
