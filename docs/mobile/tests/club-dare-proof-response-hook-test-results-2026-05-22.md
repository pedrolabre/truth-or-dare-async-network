## Arquivo testado

- `mobile/__tests__/use-club-dare-proof-response-test.tsx`

## Escopo do relatorio

Validacao automatizada do hook de envio de prova em prompt de desafio de clube.

Data da execucao: 22/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library

## Comando de teste executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-club-dare-proof-response-test.tsx
```

## Resultado do teste

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-dare-proof-response-test.tsx

PASS __tests__/use-club-dare-proof-response-test.tsx
  useClubDareProofResponse
    √ envia upload assinado antes da resposta do desafio de clube (41 ms)
    √ preserva prova selecionada quando o upload falha (6 ms)
    √ preserva prova selecionada quando a resposta real falha (5 ms)
    √ bloqueia prova quando prompt ja foi respondido ou expirou (3 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        4.456 s, estimated 5 s
Ran all test suites matching /__tests__\\use-club-dare-proof-response-test.tsx/i.
```

## Cenarios validados

- O upload assinado acontece antes da resposta do prompt de desafio.
- O upload usa `usage` `comment-attachment`.
- O upload usa `entityId` igual ao id do prompt de clube.
- A resposta do desafio envia `text`, `mediaUrl`, `mediaType` e `dareProofId` nulo.
- Quando o upload falha, a prova selecionada e o texto permanecem no estado local.
- Quando a resposta real falha, a prova selecionada permanece no estado local.
- Prompt ja respondido nao pode enviar prova.
- Prompt expirado nao pode enviar prova.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A suite passou. O fluxo de prova de desafio usa upload assinado com `comment-attachment`, envia a resposta real apos o upload e preserva o rascunho em falhas.
