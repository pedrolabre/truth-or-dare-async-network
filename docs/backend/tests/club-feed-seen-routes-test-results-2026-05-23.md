## Arquivo testado

`backend/tests/club-feed-seen.routes.test.ts`

## Escopo do relatorio

Validacao da marcacao de feed visto em clubes e da exposicao de atividade do viewer em respostas de clubes, incluindo contadores de nao lidas, estado de mute e `lastSeenAt`.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado:

```text
npm test -- --runInBand tests/club-feed-seen.routes.test.ts
```

Resultado:

```text
PASS tests/club-feed-seen.routes.test.ts
  club-feed-seen.routes
    [ok] POST /clubs/:id/feed/seen exige autenticacao (508 ms)
    [ok] POST /clubs/:id/feed/seen bloqueia outsider e membership invalida (835 ms)
    [ok] POST /clubs/:id/feed/seen atualiza lastSeenAt e marca apenas atividade do clube como lida (483 ms)
    [ok] GET /clubs/my retorna contadores de nao lidos por clube e estado de mute (322 ms)
    [ok] GET /clubs/:id retorna atividade do viewer e estado de mute (308 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        5.001 s, estimated 9 s
Ran all test suites matching /tests\\club-feed-seen.routes.test.ts/i.
```

## Validacao adicional

Comando executado:

```text
npx tsc --noEmit
```

Resultado:

- TypeScript backend validado com sucesso.

## Cenarios validados

- `POST /clubs/:id/feed/seen` rejeita requisicao sem token.
- `POST /clubs/:id/feed/seen` bloqueia outsider.
- `POST /clubs/:id/feed/seen` bloqueia membership invalida.
- `POST /clubs/:id/feed/seen` atualiza `ClubMember.lastSeenAt`.
- `POST /clubs/:id/feed/seen` marca como lidas notificacoes de atividade daquele clube.
- `POST /clubs/:id/feed/seen` nao marca notificacoes administrativas como lidas.
- `POST /clubs/:id/feed/seen` nao marca notificacoes de outro clube como lidas.
- `GET /clubs/my` retorna `viewerActivity.unreadCount` por clube.
- `GET /clubs/my` retorna `viewerActivity.mutedUntil`, `isMuted` e `lastSeenAt`.
- `GET /clubs/:id` retorna estado de atividade do viewer e mute.

## Interpretacao

A marcacao de feed visto atualiza o carimbo de visualizacao do membro e trata somente notificacoes de atividade de feed como lidas: novo prompt, resposta ao prompt, comentario e mencao.

Eventos administrativos, como aceite de convite, permanecem nao lidos quando o usuario apenas marca o feed do clube como visto. O contador de nao lidas por clube continua refletindo as notificacoes persistentes restantes daquele clube.

## Conclusao

O endpoint de feed visto preserva o isolamento por membership ativa e mantem consistentes `lastSeenAt`, contadores por clube e tratamento separado entre atividade comum e notificacoes administrativas.
