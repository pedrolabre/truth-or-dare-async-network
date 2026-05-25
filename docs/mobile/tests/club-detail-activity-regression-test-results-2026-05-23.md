## Arquivos testados

- `mobile/__tests__/club-detail-navigation-test.tsx`
- `mobile/__tests__/club-detail-shell-test.tsx`
- `mobile/__tests__/clubs-mappers-test.tsx`

## Escopo do relatorio

Validacao automatizada de regressao focada no detalhe, navegacao e mapeamento de atividade de clubes.

Data da execucao: 23/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library

## Comando executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/club-detail-navigation-test.tsx __tests__/club-detail-shell-test.tsx __tests__/clubs-mappers-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/club-detail-navigation-test.tsx __tests__/club-detail-shell-test.tsx __tests__/clubs-mappers-test.tsx

PASS __tests__/club-detail-shell-test.tsx
PASS __tests__/club-detail-navigation-test.tsx
PASS __tests__/clubs-mappers-test.tsx

Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        6.021 s, estimated 7 s
Ran all test suites matching /__tests__\\club-detail-navigation-test.tsx|__tests__\\club-detail-shell-test.tsx|__tests__\\clubs-mappers-test.tsx/i.
```

## Cenarios validados

- Navegacao do detalhe preserva o id real do clube.
- A tela de detalhe passa a aba ativa e permissao real para o feed interno.
- A tela de detalhe passa o callback de feed visto ao hook do feed.
- Estados de loading, erro, acesso negado, nao encontrado e arquivado continuam renderizando.
- Os mappers preservam atividade do viewer e fallback seguro.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. Detalhe, navegacao e mappers permaneceram estaveis apos a integracao de atividade.
