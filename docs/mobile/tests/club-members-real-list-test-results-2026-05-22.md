## Arquivos testados

- `mobile/__tests__/use-club-members-test.tsx`
- `mobile/__tests__/club-detail-components-test.tsx`

## Escopo do relatorio

Validacao automatizada da lista real de membros do clube, cobrindo carregamento por `GET /clubs/:id/members`, busca, filtros por papel e status, paginacao real, estados de tela e tratamento de acesso negado.

Data da execucao: 22/05/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- React Native Testing Library
- React Test Renderer

## Comando executado

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/use-club-members-test.tsx __tests__/club-detail-components-test.tsx -t "membros|useClubMembers|ClubMembers"
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-members-test.tsx __tests__/club-detail-components-test.tsx -t membros|useClubMembers|ClubMembers

PASS __tests__/club-detail-components-test.tsx
PASS __tests__/use-club-members-test.tsx

Test Suites: 2 passed, 2 total
Tests:       13 skipped, 8 passed, 21 total
Snapshots:   0 total
Time:        4.771 s, estimated 8 s
Ran all test suites matching /__tests__\\use-club-members-test.tsx|__tests__\\club-detail-components-test.tsx/i with tests matching "membros|useClubMembers|ClubMembers".
```

## Suites executadas

- `use-club-members-test.tsx`: validacao do hook `useClubMembers`.
- `club-detail-components-test.tsx`: validacao do painel e das linhas de membros.

## Cenarios validados

- O hook nao chama o endpoint enquanto a aba Membros nao esta ativa.
- O hook chama `GET /clubs/:id/members` quando a aba Membros fica ativa.
- A primeira consulta envia `page` e `limit`.
- Busca textual e enviada como parametro `search`.
- Filtro de papel e enviado como parametro `role`.
- Filtro de status e enviado como parametro `status`.
- Busca e filtros nao sao aplicados como filtragem local sobre uma lista ja carregada.
- Loading inicial e exposto pelo hook.
- Resposta vazia vira estado vazio.
- Erro de consulta vira estado de erro com retry.
- Refresh preserva a tela de detalhe e atualiza apenas a consulta de membros.
- Carregar mais usa a proxima pagina indicada por `pagination.page` e `pagination.totalPages`.
- Falta de acesso retorna estado claro de acesso negado.
- O painel renderiza campo de busca.
- O painel renderiza filtros de papel.
- O painel renderiza filtros de status.
- O painel renderiza linhas de membros com nome, username, papel, status e data de entrada.
- O painel renderiza botao de carregar mais quando ha proxima pagina real.
- Falha na consulta de membros nao remove o detalhe do clube carregado.

## Contrato validado

- Endpoint: `GET /clubs/:id/members`.
- Parametros usados: `page`, `limit`, `search`, `role` e `status`.
- Retorno usado: `items` e `pagination`.
- Papeis exibidos: owner, admin, moderator e member.
- Status exibidos: active, invited, requested e removed.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. A aba Membros usa o contrato real de listagem, busca, filtros e paginacao, sem inventar membros, filtros locais ou paginacao simulada.
