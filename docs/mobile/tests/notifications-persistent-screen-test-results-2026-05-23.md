## Arquivos testados

- `mobile/__tests__/use-notifications-screen-test.tsx`

## Escopo do relatorio

Validacao automatizada da tela mobile de notificacoes persistentes, cobrindo listagem real pelo servico mobile, loading, vazio, erro, retry, refresh, leitura individual, marcar todas como lidas e navegacao segura para clubes.

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
npm test -- --runInBand __tests__/use-notifications-screen-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-notifications-screen-test.tsx

PASS __tests__/use-notifications-screen-test.tsx
  useNotificationsScreen
    √ lista notificacoes persistentes reais do servico mobile (80 ms)
    √ exibe estado vazio quando a listagem volta sem itens (59 ms)
    √ exibe erro e retry recupera a lista (66 ms)
    √ refresh preserva lista carregada quando ocorre erro (66 ms)
    √ tocar em notificacao marca como lida e retorna destino do clube (67 ms)
    √ deepLink de prompt cai no destino seguro do clube (1 ms)
    √ destino nao suportado nao quebra a navegacao (1 ms)
    √ marca todas como lidas quando ha acao simples disponivel (67 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        3.247 s, estimated 4 s
Ran all test suites matching /__tests__\\use-notifications-screen-test.tsx/i.
```

## Cenarios validados

- A listagem usa o servico mobile de notificacoes persistentes.
- Loading, vazio, erro, retry e refresh ficam cobertos.
- Tocar em notificacao chama leitura individual.
- Notificacao de clube retorna destino para `/clubs/[id]`.
- Deep link de prompt de clube usa o detalhe do clube como destino seguro.
- Destino nao suportado nao quebra a navegacao.
- Marcar todas como lidas atualiza o estado local.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. A tela de notificacoes usa a API persistente existente e nao depende de push, realtime ou dados simulados no caminho principal.
