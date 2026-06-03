## Arquivos testados

```text
backend/package.json
backend/scripts/cleanup-notifications.ts
backend/src/services/notifications-retention.service.ts
backend/src/services/observability/metrics.ts
backend/src/services/observability/safe-logger.ts
backend/tests/notifications-retention.service.test.ts
backend/tests/observability.metrics.test.ts
backend/tests/observability.safe-logger.test.ts
```

## Escopo do relatorio

Validacao backend da politica manual de retencao de notificacoes antigas,
cobrindo default de 90 dias, override defensivo por ambiente, cutoff por
`createdAt`, execucao por lotes, modo `dryRun`, contagens de retorno e
observabilidade segura da limpeza.

Data da execucao: 03/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- ts-jest
- Prisma
- PostgreSQL
- TypeScript

## Comandos executados

Comandos executados em `backend/`:

```text
npm test -- --runInBand tests/notifications-retention.service.test.ts tests/observability.safe-logger.test.ts tests/observability.metrics.test.ts
```

Tambem foram executadas na regressao final do bloco:

```text
npm test -- --runInBand tests/notifications-retention.service.test.ts tests/observability.safe-logger.test.ts tests/observability.metrics.test.ts tests/search.service.test.ts tests/notifications.service.test.ts tests/notifications.routes.test.ts tests/password-reset.routes.test.ts tests/settings.observability.test.ts
npx tsc --noEmit
npm run build
```

## Resultado da execucao

Suite dedicada:

```text
PASS tests/notifications-retention.service.test.ts
  notifications-retention.service
    [ok] usa 90 dias por padrao e aceita override valido por ambiente
    [ok] remove notificacoes antigas e preserva notificacoes recentes
    [ok] dryRun conta notificacoes antigas sem apagar registros
    [ok] respeita o limite por lote durante limpeza real

PASS tests/observability.safe-logger.test.ts
  observability.safe-logger
    [ok] remove campos sensiveis de logs estruturados
    [ok] sanitiza payload bruto sem escrever no console

PASS tests/observability.metrics.test.ts
  observability.metrics
    [ok] acumula contadores diarios por dominio, tipo e resultado
    [ok] nao persiste valores sensiveis em chaves de metrica

Test Suites: 3 passed, 3 total
Tests:       8 passed, 8 total
```

Regressao final do bloco:

```text
PASS tests/search.service.test.ts
PASS tests/password-reset.routes.test.ts
PASS tests/notifications.routes.test.ts
PASS tests/notifications-retention.service.test.ts
PASS tests/settings.observability.test.ts
PASS tests/notifications.service.test.ts
PASS tests/observability.safe-logger.test.ts
PASS tests/observability.metrics.test.ts

Test Suites: 8 passed, 8 total
Tests:       69 passed, 69 total
Snapshots:   0 total
Time:        35.98 s
```

Compilacao:

```text
npx tsc --noEmit
Resultado: sucesso

npm run build
Resultado: sucesso, com prisma generate e tsc -p tsconfig.build.json
```

## Cenarios validados

- `NOTIFICATION_RETENTION_DAYS` usa default de 90 dias quando nao ha override.
- Override valido por ambiente e aceito.
- Override invalido, zero ou nao numerico volta ao default seguro.
- `cleanupOldNotifications` calcula cutoff por `createdAt`.
- Notificacoes antigas sao removidas na limpeza real.
- Notificacoes recentes sao preservadas.
- `dryRun` retorna contagem de antigas sem apagar registros.
- O limite por lote e respeitado, incluindo limpeza com `limit: 1`.
- O retorno inclui `matchedCount`, `deletedCount`, `batchCount`, `cutoff`,
  `retentionDays`, `limit` e `dryRun`.
- A retencao registra metrica e log seguro sem `title`, `body`, `deepLink`,
  `dedupeKey`, payload bruto, senha, token, Authorization, codigo de reset,
  resetToken, passwordHash ou e-mail completo.

## Observacoes

O script `backend/scripts/cleanup-notifications.ts` e manual e roda em `dryRun`
por padrao. A limpeza real exige `--execute`. Nao foi criado agendamento
automatico, worker, fila, cron externo, dashboard, APM ou infraestrutura remota.

## Conclusao

A retencao manual de notificacoes foi validada com sucesso. A implementacao
remove apenas notificacoes antigas, preserva recentes, respeita dry run e limite
por lote, retorna contagens claras e manteve observabilidade segura.
