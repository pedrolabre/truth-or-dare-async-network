## Arquivos testados

```text
mobile/app/notifications.tsx
mobile/app/clubs/[id].tsx
mobile/components/notifications/NotificationActivityCard.tsx
mobile/components/clubs/ClubDetailTabs.tsx
mobile/components/clubs/ClubAuditLogPanel.tsx
mobile/hooks/useNotificationsScreen.ts
mobile/__tests__/notifications-screen-test.tsx
mobile/__tests__/club-detail-shell-test.tsx
mobile/__tests__/club-detail-navigation-test.tsx
mobile/__tests__/club-detail-components-test.tsx
```

## Escopo do relatorio

Regressao mobile de privacidade, notificacoes, navegacao e detalhe do clube apos integrar auditoria no detalhe e ajustar textos de resultados ocultos.

Data da execucao: 06/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library
- TypeScript

## Comandos executados

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/notifications-screen-test.tsx __tests__/club-detail-shell-test.tsx __tests__/club-detail-navigation-test.tsx __tests__/club-detail-components-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/notifications-screen-test.tsx __tests__/club-detail-shell-test.tsx __tests__/club-detail-navigation-test.tsx __tests__/club-detail-components-test.tsx

PASS __tests__/club-detail-components-test.tsx
PASS __tests__/club-detail-navigation-test.tsx
PASS __tests__/club-detail-shell-test.tsx
PASS __tests__/notifications-screen-test.tsx

Test Suites: 4 passed, 4 total
Tests:       51 passed, 51 total
Snapshots:   0 total
Time:        23.362 s
Ran all test suites matching /__tests__\\notifications-screen-test.tsx|__tests__\\club-detail-shell-test.tsx|__tests__\\club-detail-navigation-test.tsx|__tests__\\club-detail-components-test.tsx/i.
```

## Cenarios validados

- A tela de detalhe preserva rota `/clubs/[id]`.
- O detalhe preserva header, feed, membros, midias, sobre, menu, refresh e navegacao de volta.
- A aba de auditoria aparece para owner/admin.
- Membro comum nao recebe aba de auditoria.
- O hook de auditoria recebe `canViewAudit: true` quando o viewer pode consultar auditoria.
- O hook de auditoria recebe `canViewAudit: false` quando o viewer e membro comum.
- A troca de abas nao aciona refresh indevido do detalhe.
- O painel de auditoria vazio renderiza sem criar rota nova.
- Notificacao privada sanitizada renderiza titulo e corpo genericos.
- Notificacao privada sanitizada nao renderiza nome de ator ou clube oculto.
- Notificacao privada sanitizada nao chama `router.push` para entidade oculta.
- Destinos de notificacao sem rota segura continuam sem navegacao.
- Componentes de aba e painel preservam alvos de toque e labels de acessibilidade.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que o detalhe do clube manteve os fluxos existentes e que dados ocultos pelo backend nao sao reconstruidos no mobile em notificacoes ou controles de auditoria.

## Conclusao

A regressao mobile de privacidade, UX, notificacoes e detalhe de clube passou com 4 suites e 51 testes.
