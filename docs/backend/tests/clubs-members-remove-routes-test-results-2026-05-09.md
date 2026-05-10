## Arquivo testado

`backend/tests/clubs.members-remove.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre o endpoint de remocao administrativa de membros de clubes:

1. `POST /clubs/:id/members/:userId/remove`
2. Remocao administrativa de membros por owner, admin e moderator.
3. Hierarquia de permissoes, contador de membros e audit log.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members-remove.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members-remove.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 18 passed, 18 total
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
npm test -- --runInBand tests/clubs.members-leave.routes.test.ts
npm test -- --runInBand tests/clubs.members.routes.test.ts
```

Resultados:

```text
PASS tests/clubs.members-leave.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 11 passed, 11 total

PASS tests/clubs.members.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 31 passed, 31 total
```

## Cenarios validados

1. Owner remove admin.
2. Owner remove moderator.
3. Owner remove member.
4. Admin remove moderator.
5. Admin remove member.
6. Moderator remove member.
7. Admin nao remove owner.
8. Admin nao remove admin.
9. Moderator nao remove admin.
10. Member nao remove member.
11. Auto-remocao por esta rota e bloqueada.
12. Alvo `invited` e bloqueado.
13. Alvo `requested` e bloqueado.
14. Alvo `removed` e bloqueado.
15. Outsider nao remove membro.
16. Clube arquivado bloqueia remocao.
17. Clube suspenso bloqueia remocao.
18. Clube deletado retorna `CLUB_NOT_FOUND`.
19. Requisicao sem token retorna `401`.

## Interpretacao

O endpoint foi validado com sucesso. Ele remove membros ativos respeitando a hierarquia owner > admin > moderator > member, preserva o papel historico da membership, decrementa `memberCount` e registra audit log `club_member_removed`.

As regressoes confirmam que a nova rota nao quebrou a saida voluntaria nem os fluxos anteriores de listagem, entrada direta, solicitacao, aprovacao e rejeicao de entrada.

## Conclusao

O fluxo de remocao administrativa esta pronto para servir de base aos Itens 12 e 13, especialmente nas regras de hierarquia e na separacao entre troca de papel e transferencia de ownership.
