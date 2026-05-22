## Arquivos testados

`mobile/__tests__/use-club-details-actions-test.tsx`

## Escopo do relatorio

Validacao automatizada das acoes do detalhe do clube, cobrindo entrada, solicitacao de entrada, bloqueio de saida para owner, silenciar, remover silencio e publicar prompt.

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
npm test -- --runInBand __tests__/use-club-details-actions-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-details-actions-test.tsx

PASS __tests__/use-club-details-actions-test.tsx
  useClubDetailsScreen actions
    √ entra em clube publico usando endpoint real e recarrega detalhe (111 ms)
    √ solicita entrada quando politica exige aprovacao (72 ms)
    √ bloqueia saida de owner antes de chamar endpoint (73 ms)
    √ silencia e remove silencio com endpoints reais (66 ms)
    √ posta prompt respeitando permissao e payload real (65 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        5.059 s
Ran all test suites matching /__tests__\\use-club-details-actions-test.tsx/i.
```

## Suites executadas

- `use-club-details-actions-test.tsx`: validacao das acoes expostas por `useClubDetailsScreen`.

## Cenarios validados

- Visitante entra em clube publico chamando a acao de `POST /clubs/:id/join`.
- Apos entrada em clube publico, o detalhe e recarregado.
- Apos entrada em clube publico, membership passa a refletir membro ativo.
- Clube com politica de aprovacao chama a acao de `POST /clubs/:id/join-requests`.
- Solicitacao de entrada envia `message` nulo quando nao ha mensagem.
- Apos solicitacao de entrada, o detalhe e recarregado.
- Owner recebe mensagem local clara antes da tentativa de saida.
- Saida de owner nao chama a acao de `POST /clubs/:id/leave`.
- Membro ativo silencia clube chamando a acao de `POST /clubs/:id/mute`.
- Membro ativo remove silencio chamando a acao de `POST /clubs/:id/unmute`.
- Estado local de silencio alterna apos sucesso de mute.
- Estado local de silencio alterna apos sucesso de unmute.
- Postagem de prompt respeita `permissions.canPostPrompt`.
- Postagem de prompt chama a acao de `POST /clubs/:id/prompts`.
- Payload de prompt preserva tipo, conteudo, dificuldade, tentativas, prazo nulo e restricao a membros.
- Apos postagem de prompt, o detalhe e recarregado.

## Observacoes

As chamadas de endpoint foram validadas por funcoes injetadas no hook. Nenhum mock foi usado como solucao final de tela; os testes substituem as funcoes de rede para isolar o comportamento do hook.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

As acoes principais do detalhe passaram. O hook chama os contratos corretos, bloqueia saida de owner antes da rede e recarrega o detalhe apos acoes bem-sucedidas.
