## Arquivos testados

`mobile/__tests__/use-clubs-screen-test.tsx`

`mobile/__tests__/clubs-screen-test.tsx`

`mobile/__tests__/clubs-mappers-test.tsx`

`mobile/__tests__/club-detail-shell-test.tsx`

## Escopo do relatorio

Validacao consolidada dos testes automatizados de Clubes no mobile, cobrindo hook, tela, mappers e shell minimo de detalhe.

Data da execucao: 18/05/2026.

## Ferramentas utilizadas

- Jest
- React Native Testing Library

## Comando executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-clubs-screen-test.tsx __tests__/clubs-screen-test.tsx __tests__/clubs-mappers-test.tsx __tests__/club-detail-shell-test.tsx
```

## Resultado da execucao

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-clubs-screen-test.tsx __tests__/clubs-screen-test.tsx __tests__/clubs-mappers-test.tsx __tests__/club-detail-shell-test.tsx

PASS __tests__/use-clubs-screen-test.tsx
PASS __tests__/clubs-screen-test.tsx
PASS __tests__/club-detail-shell-test.tsx
PASS __tests__/clubs-mappers-test.tsx

Test Suites: 4 passed, 4 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        8.118 s
Ran all test suites matching /__tests__\\use-clubs-screen-test.tsx|__tests__\\clubs-screen-test.tsx|__tests__\\clubs-mappers-test.tsx|__tests__\\club-detail-shell-test.tsx/i.
```

## Cenarios validados

- Carregamento inicial, vazio e erro de Meus Clubes.
- Descobrir sob demanda, troca de aba, loading, vazio, erro e deduplicacao.
- Busca remota com debounce, query vazia, resultado vazio, erro sem apagar Descobrir e protecao contra resposta antiga.
- Refresh em Meus Clubes, Descobrir e busca.
- Refresh de busca com erro preservando a descoberta carregada.
- Retry em Meus Clubes, Descobrir e busca.
- Retry de busca recuperando resultados reais depois de erro.
- Entrada em clube, contadores locais, erro de entrada e bloqueio de duplo toque.
- Renderizacao da tela para loading, descoberta, busca, retry visivel e navegacao.
- Navegacao para detalhe a partir de Meus Clubes, Descobrir e resultados de busca.
- Shell minimo de detalhe recebendo id real e mantendo acao de voltar.

## Validacao manual

Nao houve execucao manual no Expo Go.

## Conclusao

A selecao automatizada de Clubes passou sem falhas. O resultado acima registra somente a execucao real das suites de Clubes listadas neste relatorio.
