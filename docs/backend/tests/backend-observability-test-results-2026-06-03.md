## Arquivos testados

```text
backend/src/services/observability/safe-logger.ts
backend/src/services/observability/metrics.ts
backend/src/controllers/search/search.controller.ts
backend/src/services/notifications.service.ts
backend/src/services/notifications-retention.service.ts
backend/src/services/auth/password-reset.service.ts
backend/src/services/auth/settings.observability.ts
backend/src/services/auth/settings.metrics.ts
backend/tests/observability.safe-logger.test.ts
backend/tests/observability.metrics.test.ts
backend/tests/search.service.test.ts
backend/tests/notifications.service.test.ts
backend/tests/notifications.routes.test.ts
backend/tests/password-reset.routes.test.ts
backend/tests/settings.observability.test.ts
backend/tests/notifications-retention.service.test.ts
```

## Escopo do relatorio

Validacao backend da observabilidade segura compartilhada, cobrindo logger
reutilizavel, metricas diarias locais, preservacao do evento
`search.query_executed`, instrumentacao de notificacoes, retencao,
recuperacao de senha e configuracoes sem registro de dados sensiveis.

Data da execucao: 03/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- ts-jest
- Prisma
- PostgreSQL
- TypeScript

## Comandos executados

Comandos executados em `backend/`:

```text
npm test -- --runInBand tests/notifications-retention.service.test.ts tests/observability.safe-logger.test.ts tests/observability.metrics.test.ts tests/search.service.test.ts tests/notifications.service.test.ts tests/notifications.routes.test.ts tests/password-reset.routes.test.ts tests/settings.observability.test.ts
npx tsc --noEmit
npm run build
```

## Resultado da execucao

```text
PASS tests/search.service.test.ts
  search.service
    [ok] 22 testes de regressao de busca, privacidade, filtros, paginacao,
         conteudo, recomendados e clubes em alta

PASS tests/password-reset.routes.test.ts
  password-reset.routes
    [ok] returns ok and creates token for existing email
    [ok] invalidates previous active tokens for the same user
    [ok] returns generic success for unknown email and does not create token
    [ok] returns validation error for invalid email format
    [ok] enforces rate limit per email and ip
    [ok] returns reset token for valid code
    [ok] increments attempt count for wrong code
    [ok] locks token after max attempts
    [ok] resets password and invalidates remaining tokens
    [ok] registra observabilidade sem e-mail, codigo, token ou senha
    [ok] rejeicoes e rate limits de reset-password preservados

PASS tests/notifications.routes.test.ts
  notifications.routes
    [ok] exige autenticacao nas rotas de notificacoes
    [ok] lista notificacoes do usuario autenticado como inbox unica
    [ok] filtra e conta notificacoes nao lidas
    [ok] marca qualquer notificacao propria como lida sem exigir clube
    [ok] impede marcar notificacao de outro usuario
    [ok] marca todas as notificacoes do usuario como lidas
    [ok] retorna eventos reais de Clubes, Feed e Conta na mesma inbox
    [ok] nao expoe dados sensiveis de clube privado em notificacoes

PASS tests/notifications-retention.service.test.ts
  notifications-retention.service
    [ok] usa 90 dias por padrao e aceita override valido por ambiente
    [ok] remove notificacoes antigas e preserva notificacoes recentes
    [ok] dryRun conta notificacoes antigas sem apagar registros
    [ok] respeita o limite por lote durante limpeza real

PASS tests/settings.observability.test.ts
  settings observability
    [ok] registra log estruturado e metrica diaria ao alterar e-mail sem expor valores sensiveis
    [ok] registra log estruturado e acumula metrica diaria ao alterar senha sem expor senha

PASS tests/notifications.service.test.ts
  notifications.service
    [ok] cria notificacao persistente
    [ok] suprime self-notification quando actorId e userId sao iguais
    [ok] mantem idempotencia por dedupeKey
    [ok] lista somente notificacoes do usuario e filtra nao lidas
    [ok] trata listagem, contagem e leitura como inbox unica independente de clube
    [ok] marca uma notificacao como lida e bloqueia notificacao de outro usuario
    [ok] marca todas as notificacoes do usuario como lidas
    [ok] emite contrato basico de evento de clube sem plugar produtores reais
    [ok] registra observabilidade de notificacoes sem conteudo sensivel

PASS tests/observability.safe-logger.test.ts
  observability.safe-logger
    [ok] remove campos sensiveis de logs estruturados
    [ok] sanitiza payload bruto sem escrever no console

PASS tests/observability.metrics.test.ts
  observability.metrics
    [ok] acumula contadores diarios por dominio, tipo e resultado
    [ok] nao persiste valores sensiveis em chaves de metrica

Test Suites: 8 passed, 8 total
Tests:       69 passed, 69 total
Snapshots:   0 total
Time:        35.98 s
```

Validacoes de compilacao:

```text
npx tsc --noEmit
Resultado: sucesso

npm run build
Resultado: sucesso, com prisma generate e tsc -p tsconfig.build.json
```

## Cenarios validados

- Logger seguro redige campos e strings sensiveis antes de escrever no console.
- A sanitizacao cobre termo bruto de busca, senha, token, Authorization, codigo
  de reset, resetToken, passwordHash e e-mail completo.
- Metricas diarias acumulam contadores por `domain`, `type` e `result`.
- Metricas nao persistem e-mail, Authorization, senha, resetToken ou codigo de
  reset em chaves de contador.
- Busca preserva o evento `search.query_executed` e registra apenas
  `queryLength`, sem termo bruto.
- Notificacoes registram criacao, listagem, leitura individual e leitura em
  massa sem `title`, `body`, `deepLink`, `dedupeKey` ou payload bruto.
- Retencao registra cutoff, limite, lotes e contagens sem dados privados.
- Recuperacao de senha registra resultados basicos sem e-mail completo, codigo,
  resetToken, senha ou hash.
- Configuracoes preservam `settings.credential_change.completed` e as metricas
  existentes de alteracao de e-mail e senha.

## Eventos observados e preservados

```text
search.query_executed
notifications.created
notifications.listed
notifications.read_one
notifications.read_all
notifications.retention.cleanup
password_reset.request_processed
password_reset.code_verified
password_reset.completed
settings.credential_change.completed
```

## Interpretacao

A observabilidade ficou restrita a logs estruturados e contadores locais em
memoria. Isso atende ao bloco sem introduzir dashboard, APM, fila, worker, cron
externo, agendamento automatico ou infraestrutura remota.

## Conclusao

A observabilidade backend passou na regressao do bloco e nas validacoes de
compilacao. O logger comum, as metricas locais e as instrumentacoes novas foram
validados sem vazamento de dados sensiveis.
