## Arquivo testado

`backend/tests/clubs.audit.routes.test.ts`

## Escopo do relatorio

Validacao das rotas REST de consulta de auditoria de clubes, incluindo autenticacao obrigatoria, permissao owner/admin, bloqueio de membro comum e nao membro, clube inexistente/deletado, filtros, paginacao por cursor e payload sanitizado.

Data da execucao: 03/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/clubs.audit.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.audit.routes.test.ts
  clubs.audit.routes
    [ok] exige token para consultar auditoria do clube
    [ok] permite owner e admin consultarem auditoria com payload enxuto e metadata sanitizado
    [ok] bloqueia nao membro e membro comum de consultar auditoria completa
    [ok] retorna 404 para clube inexistente ou deletado
    [ok] aplica filtros opcionais de auditoria
    [ok] pagina auditoria por cursor e limit com limite defensivo

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

## Cenarios validados

- `GET /clubs/:id/audit-logs` rejeita requisicao sem token.
- Owner e admin ativos consultam logs de auditoria do clube.
- Membro comum e nao membro recebem `CLUB_FORBIDDEN`.
- Clube inexistente, deletado ou soft deleted retorna `CLUB_NOT_FOUND`.
- Filtros `action`, `targetUserId`, `entityType`, `from` e `to` restringem o resultado.
- `limit` e `cursor` paginam a auditoria com limite defensivo.
- O payload retorna apenas campos publicos da auditoria.
- `metadata` remove chaves sensiveis como `passwordHash`, `token`, `authorization` e payload bruto.

## Interpretacao

A suite confirma que a auditoria de clubes fica acessivel somente para owner/admin e que a consulta nao mistura regra de permissao ou sanitizacao no controller. A paginacao retorna `nextCursor` estavel, e o retorno evita expor campos internos ou dados sensiveis em `metadata`.

## Conclusao

A consulta HTTP de auditoria de clubes foi validada com sucesso para os cenarios de acesso, filtro, paginacao e payload seguro.
