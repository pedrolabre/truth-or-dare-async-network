## Arquivos testados

`mobile/__tests__/use-club-details-screen-test.tsx`

## Escopo do relatorio

Validacao automatizada do hook de detalhe do clube, cobrindo carregamento por id real, exposicao de membership e permissoes, estados de acesso, erro, retry e refresh.

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
npm test -- --runInBand __tests__/use-club-details-screen-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-details-screen-test.tsx

PASS __tests__/use-club-details-screen-test.tsx (7.952 s)
  useClubDetailsScreen
    √ carrega detalhe real pelo id da rota e expoe membership e permissoes (240 ms)
    √ mantem loading inicial enquanto o detalhe esta pendente (17 ms)
    √ trata id ausente ou vazio sem chamar a API (10 ms)
    √ mostra erro generico e retry recupera o detalhe (77 ms)
    √ mapeia 403 para acesso negado de clube privado (59 ms)
    √ mapeia 404 para clube removido ou inexistente (62 ms)
    √ representa arquivado, suspenso e removido a partir do detalhe retornado (83 ms)
    √ refresh preserva detalhe carregado quando a API falha (61 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        8.948 s
Ran all test suites matching /__tests__\\use-club-details-screen-test.tsx/i.
```

## Suites executadas

- `use-club-details-screen-test.tsx`: validacao do hook `useClubDetailsScreen`.

## Cenarios validados

- Hook chama o carregamento de detalhe com o id real recebido da rota.
- Hook mapeia `ClubDetailsApi` para o estado de tela.
- Hook expoe nome, contadores, membership e permissoes.
- Hook mantem `loading` enquanto a promise de detalhe esta pendente.
- Hook trata id ausente ou vazio como `invalid-id`.
- Id invalido nao chama a API.
- Erro generico coloca a tela em estado de erro.
- Retry apos erro chama novamente o carregamento.
- Retry recupera o detalhe apos falha inicial.
- Status 403 vira estado de acesso negado.
- Status 404 vira estado de clube removido ou inexistente.
- Clube arquivado vira estado visual de arquivado.
- Clube suspenso vira estado visual de suspenso.
- Clube removido vira estado de nao encontrado.
- Refresh com falha preserva o detalhe previamente carregado.
- Refresh com falha expoe mensagem de erro sem apagar o conteudo existente.

## Observacoes

O teste usa funcoes injetadas no hook para simular respostas reais de `GET /clubs/:id` e erros com status HTTP.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

O hook de detalhe passou em todos os cenarios automatizados de carregamento, erro, acesso, retry e refresh.
