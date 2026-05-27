## Arquivos testados

```text
mobile/__tests__/use-notifications-screen-test.tsx
mobile/__tests__/notifications-screen-test.tsx
mobile/__tests__/use-notifications-unread-count-test.tsx
```

## Escopo do relatorio

Regressao mobile da inbox de notificacoes, cobrindo tela, hook de estado, contador de nao lidas, agrupamento por periodo, estados de carregamento, vazio e erro, refresh, leitura individual, leitura em massa, sincronizacao local do contador, badge e navegacao segura para rotas existentes.

Data da execucao: 27/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library
- TypeScript

## Comandos executados

Comandos executados em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-notifications-screen-test.tsx __tests__/notifications-screen-test.tsx __tests__/use-notifications-unread-count-test.tsx
npx tsc --noEmit
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-notifications-screen-test.tsx __tests__/notifications-screen-test.tsx __tests__/use-notifications-unread-count-test.tsx

PASS __tests__/notifications-screen-test.tsx
PASS __tests__/use-notifications-unread-count-test.tsx
PASS __tests__/use-notifications-screen-test.tsx

Test Suites: 3 passed, 3 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        6.138 s, estimated 12 s
```

```text
npx tsc --noEmit
```

Resultado: validacao TypeScript concluida sem erros.

## Cenarios validados

- A tela renderiza a inbox universal com notificacoes de Clubes, Feed e Conta.
- A inbox agrupa notificacoes em `Hoje`, `Esta semana` e `Anteriores`.
- Loading inicial continua exibindo skeleton.
- Estado vazio continua exibindo copy geral da atividade do app.
- Estado de erro continua oferecendo retry.
- Refresh preserva a lista carregada quando a nova carga falha.
- Marcar uma notificacao como lida atualiza o item local e sincroniza o contador local.
- Falha ao marcar uma notificacao como lida nao reduz contador local indevidamente.
- Notificacao ja lida nao aciona decremento do contador.
- Marcar todas como lidas atualiza itens locais e zera contador local.
- Falha ao marcar todas como lidas preserva o contador local.
- `unread-count` carrega pela API persistente de notificacoes.
- Badge de nao lidas aparece apenas com contador positivo valido.
- Badge limita valores altos como `99+`.
- Navegacao segura cobre clube, feed, comentarios, dare, prova, perfil e configuracoes.
- Destino sem rota segura nao chama `router.push`.
- Destino sem rota segura ainda pode marcar notificacao como lida pelo hook.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que a inbox mobile continua consumindo a API persistente de notificacoes como caixa unica, preservando estados de tela, agrupamento, leitura, contador local e destinos seguros. A tela nao depende de rota nova, polling global, realtime, WebSocket, SSE ou push notifications.

## Conclusao

A regressao mobile passou. A tela de notificacoes, o hook da inbox e o contador de nao lidas seguem cobertos para os cenarios principais de uso, mantendo navegacao limitada a rotas existentes e comportamento seguro para destinos sem suporte.
