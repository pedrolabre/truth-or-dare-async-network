## Arquivos testados

`mobile/__tests__/use-club-details-actions-test.tsx`

## Escopo do relatorio

Validacao automatizada das acoes do detalhe do clube, cobrindo inicializacao de mute a partir da atividade do backend, silenciar, remover silencio e recarregar detalhe apos acoes.

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
npm test -- --runInBand __tests__/use-club-details-actions-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-details-actions-test.tsx

PASS __tests__/use-club-details-actions-test.tsx
  useClubDetailsScreen actions
    √ entra em clube publico usando endpoint real e recarrega detalhe (90 ms)
    √ solicita entrada quando politica exige aprovacao (61 ms)
    √ bloqueia saida de owner antes de chamar endpoint (64 ms)
    √ inicializa silencio a partir da atividade retornada pelo backend (69 ms)
    √ silencia e remove silencio com endpoints reais (71 ms)
    √ posta prompt respeitando permissao e payload real (61 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        3.207 s, estimated 7 s
Ran all test suites matching /__tests__\\use-club-details-actions-test.tsx/i.
```

## Cenarios validados

- O detalhe inicializa mute com base na atividade retornada pelo backend.
- Silenciar chama a acao real de mute injetada no hook.
- Remover silencio chama a acao real de unmute injetada no hook.
- O detalhe recarrega apos acoes bem-sucedidas.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. O detalhe sincroniza o estado visual de mute com os contratos reais.
