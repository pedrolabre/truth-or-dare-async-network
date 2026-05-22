## Arquivos testados

`mobile/__tests__/club-detail-shell-test.tsx`

## Escopo do relatorio

Validacao automatizada da tela mobile de detalhe do clube, cobrindo id real da rota, renderizacao do detalhe carregado, header, barra de acoes, navegacao de volta e estados principais.

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
npm test -- --runInBand __tests__/club-detail-shell-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/club-detail-shell-test.tsx

PASS __tests__/club-detail-shell-test.tsx (12.806 s)
  ClubDetailScreen
    √ recebe o id real da rota e renderiza o detalhe carregado (4199 ms)
    √ mantem navegacao de volta em sucesso (129 ms)
    √ mostra loading inicial sem perder o botao de voltar (94 ms)
    √ mostra erro amigavel com retry (34 ms)
    √ renderiza acesso negado, nao encontrado e arquivado como estados claros (93 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        13.587 s
Ran all test suites matching /__tests__\\club-detail-shell-test.tsx/i.
```

## Suites executadas

- `club-detail-shell-test.tsx`: validacao da tela `app/clubs/[id].tsx`.

## Cenarios validados

- Tela recebe o id real vindo de `useLocalSearchParams`.
- Tela repassa o id real para `useClubDetailsScreen`.
- Tela renderiza o nome do clube carregado.
- Tela renderiza o card de header do clube.
- Tela renderiza a barra de acoes do clube.
- Tela preserva botao de voltar em sucesso.
- Tela chama `router.back()` ao pressionar voltar.
- Loading inicial renderiza estado de carregamento.
- Loading inicial preserva botao de voltar.
- Erro amigavel renderiza titulo de erro.
- Erro amigavel renderiza mensagem retornada.
- Erro amigavel chama retry ao pressionar acao.
- Acesso negado renderiza estado de clube privado.
- Clube nao encontrado renderiza estado proprio.
- Clube arquivado renderiza estado proprio.

## Observacoes

O teste usa mock do hook de detalhe para isolar a tela dos efeitos de rede e validar a renderizacao de estados.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A tela de detalhe passou nos estados testados. A rota `/clubs/[id]`, o id real e a navegacao de volta foram preservados.
