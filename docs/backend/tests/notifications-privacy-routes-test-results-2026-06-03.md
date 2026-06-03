## Arquivo testado

`backend/tests/notifications.routes.test.ts`

## Escopo do relatorio

Validacao das rotas REST de notificacoes persistentes, incluindo autenticacao, inbox unica, leitura, contagem de nao lidas e sanitizacao de notificacoes relacionadas a contexto privado.

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
npm test -- --runInBand tests/notifications.routes.test.ts
```

Resultado:

```text
PASS tests/notifications.routes.test.ts
  notifications.routes
    [ok] exige autenticacao nas rotas de notificacoes
    [ok] lista notificacoes do usuario autenticado como inbox unica
    [ok] filtra e conta notificacoes nao lidas
    [ok] marca qualquer notificacao propria como lida sem exigir clube
    [ok] impede marcar notificacao de outro usuario
    [ok] marca todas as notificacoes do usuario como lidas
    [ok] retorna eventos reais de Clubes, Feed e Conta na mesma inbox e le qualquer dominio
    [ok] nao expoe dados sensiveis de clube privado em notificacoes

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

## Cenarios validados

- Rotas de notificacoes exigem autenticacao.
- Usuario autenticado lista apenas as proprias notificacoes.
- Filtro de leitura, contagem de nao lidas, leitura individual e leitura em massa continuam funcionando.
- Eventos reais de clubes, feed e conta aparecem na mesma inbox.
- Notificacao ligada a clube privado sem permissao retorna titulo, corpo e `deepLink` genericos.
- Notificacao privada nao expõe nome do clube, rota interna do clube, `actorId`, `clubId`, `referenceType` ou `referenceId`.

## Interpretacao

A suite confirma que a inbox segue isolada por usuario e que contextos privados nao vazam dados por campos de apresentacao ou navegacao. A sanitizacao tambem preserva o contrato de leitura e listagem.

## Conclusao

As rotas de notificacoes foram validadas com sucesso para isolamento por usuario, operacoes de leitura e payload seguro em contexto privado.
