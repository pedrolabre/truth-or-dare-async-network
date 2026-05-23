## Arquivos testados

```text
backend/tests/clubs.invites.routes.test.ts
backend/tests/clubs.members.routes.test.ts
backend/tests/clubs.members-role.routes.test.ts
backend/tests/club-prompts.routes.test.ts
backend/tests/club-prompt-responses.routes.test.ts
backend/tests/club-prompt-comments.routes.test.ts
backend/tests/club-feed.routes.test.ts
backend/tests/clubs.moderation-final-regression.routes.test.ts
```

## Escopo do relatorio

Regressao focada nos fluxos backend de clubes diretamente relacionados a convites, solicitacoes de entrada, papeis de membros, prompts, respostas, comentarios, feed privado e moderacao.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv

## Resultado da execucao

Comando executado:

```text
npm test -- --runInBand tests/clubs.invites.routes.test.ts tests/clubs.members.routes.test.ts tests/clubs.members-role.routes.test.ts tests/club-prompts.routes.test.ts tests/club-prompt-responses.routes.test.ts tests/club-prompt-comments.routes.test.ts tests/club-feed.routes.test.ts tests/clubs.moderation-final-regression.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.members.routes.test.ts (17.174 s)
PASS tests/club-prompt-responses.routes.test.ts (9.063 s)
PASS tests/clubs.invites.routes.test.ts (6.65 s)
PASS tests/club-feed.routes.test.ts (5.716 s)
PASS tests/club-prompt-comments.routes.test.ts (5.321 s)
PASS tests/clubs.members-role.routes.test.ts (7.117 s)
PASS tests/clubs.moderation-final-regression.routes.test.ts
PASS tests/club-prompts.routes.test.ts

Test Suites: 8 passed, 8 total
Tests:       96 passed, 96 total
Snapshots:   0 total
Time:        56.153 s, estimated 64 s
Ran all test suites matching /tests\\clubs.invites.routes.test.ts|tests\\clubs.members.routes.test.ts|tests\\clubs.members-role.routes.test.ts|tests\\club-prompts.routes.test.ts|tests\\club-prompt-responses.routes.test.ts|tests\\club-prompt-comments.routes.test.ts|tests\\club-feed.routes.test.ts|tests\\clubs.moderation-final-regression.routes.test.ts/i.
```

## Cenarios validados

- Convites de clube continuam funcionando para criacao, listagem, aceite e recusa.
- Solicitacoes de entrada e revisao por administradores continuam protegidas por permissao.
- Alteracoes de papel continuam respeitando hierarquia, bloqueios para owner e memberships invalidas.
- Criacao de prompts continua respeitando autenticacao, membership ativa, validacao de payload e audit log.
- Respostas a prompts continuam respeitando clube ativo, prompt disponivel, limites e membership.
- Comentarios em prompts continuam respeitando autenticacao, validacao de texto, membership e disponibilidade do prompt.
- Feed de clube continua bloqueando outsider em clube privado, membership inativa e clubes indisponiveis.
- Moderacao continua validando reports, bloqueios de conteudo, remocao e protecoes associadas.

## Interpretacao

A regressao confirma que as integracoes de notificacoes persistentes nao alteraram os contratos HTTP existentes dos principais produtores de eventos de clubes.

Os fluxos privados continuam dependentes de membership valida, e as rotas de feed e moderacao preservam os bloqueios existentes para outsiders, usuarios removidos ou bloqueados e clubes indisponiveis.

## Conclusao

Os fluxos existentes de convites, solicitacoes, prompts, respostas, comentarios, feed de clube e moderacao seguem passando apos as integracoes de notificacoes persistentes.
