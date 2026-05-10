## Arquivo testado

`backend/tests/clubs.members-actions-matrix.routes.test.ts`

## Escopo do relatorio

Este relatorio cobre a matriz final de autorizacao e estado para acoes de membros de clubes:

1. Remocao administrativa.
2. Alteracao de papel.
3. Transferencia de posse.
4. Saida voluntaria.
5. Silencio e remocao de silencio de notificacoes.
6. Bloqueios para memberships nao ativas e outsider.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Resultado da execucao

Comando executado em `backend/`:

```bash
npm test -- --runInBand tests/clubs.members-actions-matrix.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members-actions-matrix.routes.test.ts
Test Suites: 1 passed, 1 total
Tests: 23 passed, 23 total
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

1. Owner pode remover member.
2. Admin pode remover moderator.
3. Moderator pode remover member.
4. Member nao pode remover member.
5. Owner pode alterar member para admin.
6. Admin pode alterar member para moderator.
7. Moderator nao pode alterar papel de member.
8. Member nao pode alterar papel de member.
9. Owner pode transferir posse.
10. Admin nao pode transferir posse.
11. Moderator nao pode transferir posse.
12. Member nao pode transferir posse.
13. Owner nao pode sair sem transferir posse.
14. Admin pode sair do clube.
15. Moderator pode sair do clube.
16. Member pode sair do clube.
17. Owner ativo pode silenciar e remover silencio.
18. Admin ativo pode silenciar e remover silencio.
19. Moderator ativo pode silenciar e remover silencio.
20. Member ativo pode silenciar e remover silencio.
21. Membership `invited` nao executa acoes de membro ativo.
22. Membership `requested` nao executa acoes de membro ativo.
23. Outsider nao executa acoes de membro.

## Interpretacao

A matriz confirma que os papeis ativos seguem a hierarquia esperada para remocao, alteracao de papel e transferencia de posse. Tambem confirma que preferencias de silencio sao permitidas para todos os membros ativos, enquanto memberships pendentes e outsiders nao conseguem executar acoes reservadas a membros ativos.

Os testes detalhados de cada rota continuam responsaveis por cobrir mensagens, contadores, persistencia especifica e audit logs. Esta matriz funciona como validacao transversal final de autorizacao e estado.

## Conclusao

A matriz final de papeis e estados foi validada com sucesso para os fluxos principais de membros de clubes.
