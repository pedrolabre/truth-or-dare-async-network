## Arquivo testado

`backend/tests/clubs.notifications.routes.test.ts`

## Escopo do relatorio

Validacao das integracoes backend que criam notificacoes persistentes a partir de eventos reais de clubes, incluindo convites, solicitacoes de entrada, prompts, respostas, comentarios, mencoes e promocao de membro.

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
npm test -- --runInBand tests/clubs.notifications.routes.test.ts
```

Resultado:

```text
PASS tests/clubs.notifications.routes.test.ts (7.73 s)
  clubs.notifications.routes
    [ok] cria notificacoes para convite recebido e convite aceito (796 ms)
    [ok] notifica owner/admin em solicitacao e solicitante em aprovacao ou rejeicao (844 ms)
    [ok] novo prompt notifica apenas membros ativos elegiveis, exceto autor e mutados (663 ms)
    [ok] resposta notifica autor do prompt, exceto autores respondendo e autores mutados (356 ms)
    [ok] comentario notifica autor e mencoes validas sem duplicidade (394 ms)
    [ok] promocao notifica usuario promovido mesmo com clube mutado e rebaixamento nao notifica (228 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        7.837 s, estimated 11 s
Ran all test suites matching /tests\\clubs.notifications.routes.test.ts/i.
```

## Validacao adicional

Comandos executados:

```text
npx prisma validate
npx tsc --noEmit
```

Resultados:

- Prisma schema validado com sucesso.
- TypeScript backend validado com sucesso.

## Cenarios validados

- Convite recebido cria notificacao para o convidado.
- Convite aceito cria notificacao para quem convidou.
- Solicitacao de entrada criada notifica owner/admin ativos.
- Solicitacao aprovada notifica o solicitante.
- Solicitacao rejeitada notifica o solicitante.
- Novo prompt notifica membros ativos elegiveis.
- Novo prompt nao notifica o autor.
- Novo prompt respeita clube mutado.
- Usuarios convidados, removidos, bloqueados e outsiders nao recebem atividade privada.
- Resposta notifica o autor do prompt quando o respondente e outra pessoa.
- Resposta nao notifica quando o respondente e o proprio autor.
- Resposta respeita clube mutado pelo autor do prompt.
- Comentario notifica o autor do prompt quando aplicavel.
- Mencao por `@username` notifica membro ativo mencionado.
- Mencao nao notifica usuario sem membership valida.
- Comentario e mencao nao geram duplicidade para o mesmo destinatario.
- Promocao notifica o usuario promovido.
- Promocao continua chegando mesmo quando o clube esta mutado.
- Rebaixamento nao cria notificacao de promocao.

## Interpretacao

As notificacoes administrativas importantes nao dependem da preferencia de mute do clube. As notificacoes de atividade comum respeitam membership ativa, exclusao do ator e `mutedUntil` futuro.

As mencoes foram tratadas como atividade comum do clube, portanto tambem respeitam mute e exigem que o usuario mencionado tenha acesso atual ao conteudo por membership ativa.

## Conclusao

As rotas e servicos produtores de eventos de clube criam notificacoes persistentes coerentes, sem duplicidade por destinatario e sem entregar atividade privada a usuarios sem membership valida.
