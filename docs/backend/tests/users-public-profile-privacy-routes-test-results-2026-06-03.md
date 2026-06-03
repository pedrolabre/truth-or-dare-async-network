## Arquivo testado

`backend/tests/users.routes.test.ts`

## Escopo do relatorio

Validacao das rotas de usuarios, com foco em listagem autenticada e no contrato de perfil publico para contas publicas e privadas.

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
npm test -- --runInBand tests/users.routes.test.ts
```

Resultado:

```text
PASS tests/users.routes.test.ts
  users.routes
    [ok] deve listar usuarios autenticado com sucesso sem retornar o proprio usuario
    [ok] deve filtrar usuarios pela query
    [ok] deve retornar 401 quando nao houver token
    [ok] GET /users/:id/public retorna perfil publico com contrato seguro
    [ok] GET /users/:id/public retorna perfil restrito para conta privada sem permissao
    [ok] GET /users/:id/public retorna perfil privado completo para viewer com clube ativo em comum
    [ok] GET /users/:id/public retorna 404 para usuario inexistente

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

## Cenarios validados

- Listagem de usuarios autenticada preserva contrato existente.
- Perfil publico de conta publica retorna campos seguros e estatisticas publicas.
- Conta privada sem viewer autorizado retorna perfil restrito.
- Perfil restrito nao expõe `username`, `bio`, `email`, `passwordHash` ou estatisticas reais.
- Viewer com clube ativo em comum recebe o perfil publico completo da conta privada.
- Usuario inexistente retorna 404.

## Interpretacao

A suite confirma que a rota publica continua disponivel sem token, mas passa a usar autenticacao opcional quando enviada. Com isso, contas privadas recebem resposta restrita para viewers sem permissao e resposta completa apenas quando a politica permite.

## Conclusao

As rotas de usuarios foram validadas com sucesso para perfil publico seguro, perfil privado restrito e acesso autorizado por clube ativo em comum.
