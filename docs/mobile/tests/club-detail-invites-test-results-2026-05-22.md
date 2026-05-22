## Arquivos testados

`mobile/__tests__/use-club-invites-test.tsx`

## Escopo do relatorio

Validacao automatizada do fluxo de convites do detalhe do clube, cobrindo busca de usuarios, debounce, mapeamento de resultados, envio de convite e bloqueio por permissao.

Data da execucao: 22/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library
- React Test Renderer

## Comandos executados

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-club-invites-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-invites-test.tsx

PASS __tests__/use-club-invites-test.tsx
  useClubInvites
    √ busca usuarios reais com debounce e envia convite pelo endpoint (108 ms)
    √ nao busca nem envia quando permissao de convite esta bloqueada (16 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        5.869 s
Ran all test suites matching /__tests__\\use-club-invites-test.tsx/i.
```

## Suites executadas

- `use-club-invites-test.tsx`: validacao do hook `useClubInvites`.

## Cenarios validados

- Hook agenda busca de usuarios com debounce.
- Query digitada e enviada para busca depois do debounce.
- Busca usa texto normalizado.
- Resultado de usuario e mapeado para `id`, `name` e `email`.
- Hook evita duplicacao de usuarios por id.
- Envio de convite chama a acao de convite com `clubId`, `userId` e mensagem nula.
- Usuario convidado passa a constar em `invitedUserIds` apos sucesso.
- Mensagem de sucesso de convite e registrada.
- Sem permissao de convite, hook nao chama busca.
- Sem permissao de convite, hook nao chama envio de convite.
- Sem permissao de convite, lista de usuarios permanece vazia.

## Observacoes

O teste usa timers falsos do Jest para avancar o debounce de busca sem aguardar tempo real.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

O fluxo de convites passou. A busca respeita debounce, o envio chama o contrato esperado e a ausencia de permissao bloqueia busca e envio.
