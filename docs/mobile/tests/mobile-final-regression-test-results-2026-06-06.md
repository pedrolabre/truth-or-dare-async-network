## Arquivos testados

```text
mobile/app
mobile/components
mobile/hooks
mobile/services
mobile/types
mobile/__tests__
```

## Escopo do relatorio

Regressao final mobile apos alteracoes em auditoria de clubes, filtros persistidos, privacidade, notificacoes, busca e detalhe de clube.

Data da execucao: 06/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- Expo lint
- TypeScript
- React Native Testing Library

## Comandos executados

Comandos executados em `mobile/`:

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

## Resultado da execucao

```text
npx tsc --noEmit
```

Resultado: validacao TypeScript concluida sem erros.

```text
> mobile@1.0.0 lint
> expo lint

env: load .env.local
env: export EXPO_PUBLIC_API_URL
```

Resultado final: lint mobile concluido sem erros.

Saida do terminal da regressao Jest:

```text
> mobile@1.0.0 test
> jest --runInBand

PASS __tests__/signup-screen-test.tsx
PASS __tests__/settings-accessibility-test.tsx
PASS __tests__/use-clubs-screen-test.tsx
PASS __tests__/use-recovery-flow-test.tsx
PASS __tests__/settings-screen-test.tsx
PASS __tests__/use-settings-screen-test.tsx
PASS __tests__/club-detail-navigation-test.tsx
PASS __tests__/use-notifications-screen-test.tsx
PASS __tests__/club-detail-shell-test.tsx
PASS __tests__/notifications-screen-test.tsx
PASS __tests__/use-club-details-screen-test.tsx
PASS __tests__/use-club-feed-test.tsx
PASS __tests__/settings-submit-modals-test.tsx
PASS __tests__/settings-theme-modals-test.tsx
PASS __tests__/create-group-screen-test.tsx
PASS __tests__/club-detail-components-test.tsx
PASS __tests__/use-club-details-actions-test.tsx
PASS __tests__/login-screen-test.tsx
PASS __tests__/clubs-screen-test.tsx
PASS __tests__/useSearchScreen.test.ts
PASS __tests__/SearchFilterModal.test.tsx
PASS __tests__/theme-context-test.tsx
PASS __tests__/api.settings.test.ts
PASS __tests__/settings-change-password-modal-test.tsx
PASS __tests__/public-profile-privacy-test.tsx
PASS __tests__/use-club-members-test.tsx
PASS __tests__/use-notifications-unread-count-test.tsx
PASS __tests__/club-audit-log-panel-test.tsx
PASS __tests__/settings-sessions-modal-test.tsx
PASS __tests__/settings-keyboard-flow-test.tsx
PASS __tests__/settings-change-email-modal-test.tsx
PASS __tests__/settings-report-abuse-modal-test.tsx
PASS __tests__/use-create-group-screen-test.tsx
PASS __tests__/use-club-audit-log-test.tsx
PASS __tests__/SearchBar.test.tsx
PASS __tests__/settings-delete-account-modal-test.tsx
PASS __tests__/use-club-moderation-test.tsx
PASS __tests__/settings-about-modal-test.tsx
PASS __tests__/SearchStates.test.tsx
PASS __tests__/verification-code-boxes-test.tsx
PASS __tests__/clubs-mappers-test.tsx
PASS __tests__/use-club-prompt-composer-test.tsx
PASS __tests__/use-club-settings-test.tsx
PASS __tests__/use-club-invites-test.tsx
PASS __tests__/SearchRecentSearches.test.tsx
PASS __tests__/recentSearches.test.ts
PASS __tests__/use-club-dare-proof-response-test.tsx
PASS __tests__/searchMappers.test.ts
PASS __tests__/api.search.test.ts
PASS __tests__/settingsStorage.test.ts
PASS __tests__/clubs-api-audit-test.ts
PASS __tests__/search-preferences-test.ts
PASS __tests__/auth-recovery-api-test.tsx

Test Suites: 53 passed, 53 total
Tests:       481 passed, 481 total
Snapshots:   0 total
Time:        58.898 s
Ran all test suites.
```

## Observacoes da execucao

- A regressao completa emitiu logs e `console.error` esperados em testes existentes de login/signup que validam sucesso e falha de autenticacao.
- Esses logs nao representam falha da execucao; o resumo final do Jest foi 53 suites e 481 testes passando.
- `mobile/package.json` nao possui script `build`; por isso nao houve execucao de build mobile.

## Cenarios validados

- Auditoria de clube no client, hook, painel e detalhe.
- Persistencia local de filtros de busca.
- Busca com filtros, debounce, paginacao e mapeadores.
- Perfil publico restrito.
- Notificacoes com navegacao segura e payload privado sanitizado.
- Detalhe de clube, feed, membros, moderacao, convites, navegacao e componentes.
- Configuracoes, tema, sessoes, suporte, email, senha e exclusao de conta.
- Recuperacao de senha.
- Autenticacao mobile.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que as alteracoes mobile preservaram a suite automatizada completa, com TypeScript e lint sem erros.

## Conclusao

A regressao final mobile passou com TypeScript, lint e Jest completo: 53 suites e 481 testes.
