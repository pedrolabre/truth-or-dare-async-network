## Arquivo testado

`mobile/__tests__/club-detail-shell-test.tsx`

## Escopo do relatorio

Validacao automatizada da integracao das abas internas na tela de detalhe do clube, cobrindo renderizacao no detalhe carregado, troca de painel e preservacao da navegacao de volta.

Data da execucao: 22/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library

## Comando executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/club-detail-shell-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/club-detail-shell-test.tsx

PASS __tests__/club-detail-shell-test.tsx (6.537 s)
  ClubDetailScreen
    PASS recebe o id real da rota e renderiza o detalhe carregado (1326 ms)
    PASS mantem navegacao de volta em sucesso (27 ms)
    PASS troca abas internas sem acionar refresh do detalhe carregado (127 ms)
    PASS mostra loading inicial sem perder o botao de voltar (34 ms)
    PASS mostra erro amigavel com retry (11 ms)
    PASS renderiza acesso negado, nao encontrado e arquivado como estados claros (27 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        7.02 s, estimated 13 s
Ran all test suites matching /__tests__\\club-detail-shell-test.tsx/i.
```

## Cenarios validados

- A tela renderiza as quatro abas no detalhe carregado.
- A aba Feed exibe placeholder honesto sem conteudo local.
- A troca de aba atualiza apenas o painel visivel.
- A troca de aba nao aciona refresh do detalhe ja carregado.
- A aba Sobre aparece integrada a tela.
- A aba Ranking aparece integrada a tela com estado indisponivel.
- A aba Membros exibe placeholder honesto usando o contador real do detalhe.
- A navegacao de volta continua preservada.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao da tela passou. As abas internas foram integradas ao detalhe carregado, alternam o painel visivel com estabilidade e preservam a navegacao de volta.
