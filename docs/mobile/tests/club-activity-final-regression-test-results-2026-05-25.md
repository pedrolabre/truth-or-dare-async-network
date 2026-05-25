## Arquivos testados

```text
mobile/__tests__/use-clubs-screen-test.tsx
mobile/__tests__/clubs-screen-test.tsx
mobile/__tests__/use-club-details-actions-test.tsx
mobile/__tests__/use-club-feed-test.tsx
mobile/__tests__/use-notifications-screen-test.tsx
mobile/__tests__/club-detail-navigation-test.tsx
mobile/__tests__/club-detail-shell-test.tsx
mobile/__tests__/clubs-mappers-test.tsx
```

## Escopo do relatorio

Regressao mobile final de atividade e notificacoes persistentes de Clubes, cobrindo lista de Clubes, detalhe, feed interno, tela de notificacoes, navegacao e mappers.

Data da execucao: 25/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library

## Resultado da execucao

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-clubs-screen-test.tsx __tests__/clubs-screen-test.tsx __tests__/use-club-details-actions-test.tsx __tests__/use-club-feed-test.tsx __tests__/use-notifications-screen-test.tsx __tests__/club-detail-navigation-test.tsx __tests__/club-detail-shell-test.tsx __tests__/clubs-mappers-test.tsx
```

Resultado:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-clubs-screen-test.tsx __tests__/clubs-screen-test.tsx __tests__/use-club-details-actions-test.tsx __tests__/use-club-feed-test.tsx __tests__/use-notifications-screen-test.tsx __tests__/club-detail-navigation-test.tsx __tests__/club-detail-shell-test.tsx __tests__/clubs-mappers-test.tsx

PASS __tests__/use-club-details-actions-test.tsx
PASS __tests__/use-clubs-screen-test.tsx
PASS __tests__/club-detail-navigation-test.tsx
PASS __tests__/club-detail-shell-test.tsx
PASS __tests__/use-notifications-screen-test.tsx
PASS __tests__/use-club-feed-test.tsx
PASS __tests__/clubs-mappers-test.tsx
PASS __tests__/clubs-screen-test.tsx

Test Suites: 8 passed, 8 total
Tests:       84 passed, 84 total
Snapshots:   0 total
Time:        11.508 s, estimated 28 s
Ran all test suites matching /__tests__\\use-clubs-screen-test.tsx|__tests__\\clubs-screen-test.tsx|__tests__\\use-club-details-actions-test.tsx|__tests__\\use-club-feed-test.tsx|__tests__\\use-notifications-screen-test.tsx|__tests__\\club-detail-navigation-test.tsx|__tests__\\club-detail-shell-test.tsx|__tests__\\clubs-mappers-test.tsx/i.
```

## Cenarios validados

- Badge/count de atividade em Meus Clubes e ausencia de badge quando nao ha nao lidos.
- Mapeamento de `viewerActivity`, `unreadCount`, `mutedUntil` e `isMuted`.
- Detalhe de clube inicializa mute a partir do backend.
- Silenciar/desmutar usa as acoes reais integradas ao hook.
- Feed interno marca visto apenas quando esta ativo e carregado.
- Falha de marcar feed visto nao quebra a renderizacao.
- Tela de notificacoes cobre loading, vazio, erro, retry, refresh, leitura individual, marcar todas como lidas e destino seguro.
- Navegacao de detalhe e mappers relacionados seguem passando.

## Interpretacao

A regressao confirma que as alteracoes recentes de backend e documentacao nao quebraram os fluxos mobile ja integrados para atividade de Clubes e notificacoes persistentes.

Os testes seguem usando dublês controlados dos servicos nos hooks e telas, preservando os contratos reais integrados no codigo mobile sem introduzir push, Expo Notifications ou realtime.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador, emulador ou navegador.

## Conclusao

A regressao mobile final passou. A experiencia persistente de atividade e notificacoes continua validada sem push, Expo Notifications ou realtime.
