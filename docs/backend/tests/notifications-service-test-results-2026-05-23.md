## Arquivo testado

`backend/tests/notifications.service.test.ts`

## Escopo do relatorio

Validacao do servico responsavel pela persistencia, listagem, contagem e marcacao de leitura de notificacoes, incluindo idempotencia, isolamento por usuario e emissao basica de eventos de clube.

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
PASS tests/notifications.service.test.ts (6.037 s)
  notifications.service
    [ok] cria notificacao persistente (860 ms)
    [ok] suprime self-notification quando actorId e userId sao iguais (182 ms)
    [ok] mantem idempotencia por dedupeKey (126 ms)
    [ok] lista somente notificacoes do usuario e filtra nao lidas (382 ms)
    [ok] marca uma notificacao como lida e bloqueia notificacao de outro usuario (298 ms)
    [ok] marca todas as notificacoes do usuario como lidas (313 ms)
    [ok] emite contrato basico de evento de clube sem plugar produtores reais (254 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        6.204 s, estimated 8 s
Ran all test suites matching /tests\\notifications.service.test.ts/i.
```

## Validacao adicional

```text
npx prisma validate
npx tsc --noEmit
```

Resultados:

- Prisma schema validado com sucesso.
- TypeScript backend validado com sucesso.
- Prisma Client gerado com sucesso antes da validacao tipada.

## Cenarios validados

- Criacao de notificacao persistente.
- Supressao de notificacao quando `actorId === userId`.
- Idempotencia por `dedupeKey`.
- Listagem restrita ao usuario informado.
- Filtro de notificacoes nao lidas.
- Contagem de notificacoes nao lidas.
- Marcacao de uma notificacao como lida.
- Bloqueio ao tentar marcar notificacao pertencente a outro usuario.
- Marcacao de todas as notificacoes nao lidas do usuario.
- Emissao basica de evento de convite recebido em clube.

## Interpretacao

O servico persiste notificacoes com os campos esperados, aplica supressao para acoes do proprio usuario e evita duplicidade quando `dedupeKey` e informado. As consultas retornam apenas dados do usuario solicitado e as operacoes de leitura respeitam a propriedade da notificacao.

A emissao basica de evento de clube cria uma notificacao persistente com tipo, ator, clube, referencia e deep link coerentes, sem depender de integracao com outros services.

## Conclusao

A camada de servico de notificacoes esta validada, cobrindo persistencia, idempotencia, consulta, contagem, leitura, autorizacao por usuario e emissao basica de evento de clube.
