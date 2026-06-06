## Arquivos testados

```text
mobile/services/searchPreferences.ts
mobile/hooks/useSearchScreen.ts
mobile/services/searchMappers.ts
mobile/app/search.tsx
mobile/app/profile/[id].tsx
mobile/components/search/SearchFilterModal.tsx
mobile/__tests__/search-preferences-test.ts
mobile/__tests__/useSearchScreen.test.ts
mobile/__tests__/SearchFilterModal.test.tsx
mobile/__tests__/searchMappers.test.ts
mobile/__tests__/public-profile-privacy-test.tsx
```

## Escopo do relatorio

Validacao mobile da persistencia local de filtros de busca e regressao associada de busca, filtros, mapeadores e perfil publico restrito.

Data da execucao: 06/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library
- @react-native-async-storage/async-storage
- TypeScript

## Comandos executados

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/search-preferences-test.ts __tests__/useSearchScreen.test.ts __tests__/SearchFilterModal.test.tsx __tests__/searchMappers.test.ts __tests__/public-profile-privacy-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/search-preferences-test.ts __tests__/useSearchScreen.test.ts __tests__/SearchFilterModal.test.tsx __tests__/searchMappers.test.ts __tests__/public-profile-privacy-test.tsx

PASS __tests__/public-profile-privacy-test.tsx
PASS __tests__/search-preferences-test.ts
PASS __tests__/useSearchScreen.test.ts
PASS __tests__/SearchFilterModal.test.tsx
PASS __tests__/searchMappers.test.ts

Test Suites: 5 passed, 5 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        11.226 s
Ran all test suites matching /__tests__\\search-preferences-test.ts|__tests__\\useSearchScreen.test.ts|__tests__\\SearchFilterModal.test.tsx|__tests__\\searchMappers.test.ts|__tests__\\public-profile-privacy-test.tsx/i.
```

## Cenarios validados

- Filtros de busca sao salvos em `AsyncStorage`.
- Chave de storage usa namespace por usuario autenticado.
- Usuario anonimo usa namespace separado.
- O termo bruto de busca nao e serializado no storage.
- Filtros salvos sao normalizados ao carregar.
- Payload ausente ou invalido retorna `null`.
- Falha de leitura retorna `null` sem quebrar a tela.
- Falha de escrita e limpeza e tratada de forma silenciosa.
- `useSearchScreen` restaura filtros salvos sem bloquear UI.
- Alteracao de filtro feita durante leitura pendente nao e sobrescrita pelo valor antigo.
- Aplicar filtros salva somente `SearchFilters` normalizados.
- Aplicar filtros vazios remove a persistencia.
- Limpar filtros remove a persistencia local.
- Troca de usuario carrega namespace proprio e zera o estado visual anterior enquanto a leitura nova acontece.
- Filtros continuam sendo enviados para busca remota com debounce e paginacao.
- `SearchFilterModal` continua aplicando e limpando filtros corretamente.
- Mapper de usuario nao cria username a partir do ID quando a API omite username.
- Perfil publico restrito nao exibe CTA de desafio, username inventado ou estatisticas zeradas como dado real.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Interpretacao

A execucao confirma que os filtros de busca sao preferencias locais do usuario e que o mobile nao persiste nem reexibe o termo bruto de busca como preferencia. A regressao tambem confirma que payloads restritos continuam tratados como dados indisponiveis.

## Conclusao

A validacao de persistencia local de filtros e privacidade associada passou com 5 suites e 35 testes.
