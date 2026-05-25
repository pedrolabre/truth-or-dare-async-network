## Arquivos testados

`mobile/__tests__/clubs-screen-test.tsx`

## Escopo do relatorio

Validacao automatizada da tela de Clubes, cobrindo renderizacao de cards, navegacao, badge discreto de atividade nova e ausencia de badge quando nao ha nao lidos.

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
npm test -- --runInBand __tests__/clubs-screen-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/clubs-screen-test.tsx

PASS __tests__/clubs-screen-test.tsx (5.326 s)
  ClubsScreen
    √ renderiza skeleton no carregamento inicial (839 ms)
    √ renderiza ClubDiscoverCard com dados reais da aba Descobrir (92 ms)
    √ navega para o detalhe ao pressionar um card de Meus Clubes (27 ms)
    √ exibe badge discreto para clube com atividade nova (32 ms)
    √ nao exibe badge quando clube nao tem atividade nova (28 ms)
    √ navega para a criacao ao pressionar Criar grupo (29 ms)
    √ navega para o detalhe ao pressionar um card de Descobrir (35 ms)
    √ pressionar Entrar nao navega e chama a acao de entrada (30 ms)
    √ renderiza resultados de busca remota na aba Descobrir (35 ms)
    √ navega para o detalhe ao pressionar um resultado de busca (35 ms)
    √ renderiza retry visivel no estado de erro (22 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        5.784 s
Ran all test suites matching /__tests__\\clubs-screen-test.tsx/i.
```

## Cenarios validados

- Clube com atividade nova mostra badge discreto.
- Clube sem nao lidos nao mostra badge.
- Cards de Meus Clubes e Descobrir mantem navegacao existente.
- Estados de skeleton, erro e retry continuam renderizando.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. A tela de Clubes destaca atividade nova sem alterar os fluxos de navegacao e estados existentes.
