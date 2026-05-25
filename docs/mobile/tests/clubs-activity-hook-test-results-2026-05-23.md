## Arquivos testados

`mobile/__tests__/use-clubs-screen-test.tsx`

## Escopo do relatorio

Validacao automatizada do hook da tela de Clubes, cobrindo carregamento de Meus Clubes, refresh, busca, retry e atualizacao local de atividade.

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
npm test -- --runInBand __tests__/use-clubs-screen-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-clubs-screen-test.tsx

PASS __tests__/use-clubs-screen-test.tsx (5.011 s)
  useClubsScreen
    √ carrega Meus Clubes ao abrir a tela (98 ms)
    √ representa resposta vazia em Meus Clubes (62 ms)
    √ representa erro ao carregar Meus Clubes (61 ms)
    √ não carrega Descobrir na abertura inicial (64 ms)
    √ carrega Descobrir ao trocar de aba e deduplica os grupos reais (139 ms)
    √ representa loading e vazio de Descobrir (62 ms)
    √ representa erro de Descobrir sem contaminar Meus Clubes (123 ms)
    √ debounce evita chamada imediata de searchClubs ao alterar query (131 ms)
    √ executa busca remota com debounce e usa resultados reais (125 ms)
    √ usa search-empty quando a busca remota retorna vazia (121 ms)
    √ nao chama searchClubs na aba Meus Clubes (62 ms)
    √ query vazia volta para a descoberta carregada (127 ms)
    √ ignora resposta antiga quando buscas retornam fora de ordem (134 ms)
    √ erro de busca nao apaga a descoberta carregada (117 ms)
    √ entrada com sucesso atualiza contadores locais e preserva aba e query (132 ms)
    √ erro de entrada preserva dados locais e expoe erro amigavel (136 ms)
    √ ignora duplo toque enquanto entrada esta em andamento (132 ms)
    √ refresh em Meus Clubes chama getMyClubs novamente sem trocar aba (60 ms)
    √ refresh em Descobrir sem query recarrega discoverClubs mesmo ja carregado (121 ms)
    √ refresh em busca recarrega searchClubs com a query atual (120 ms)
    √ refresh em busca com erro preserva discovery carregado (116 ms)
    √ retry apos erro de Meus Clubes repete getMyClubs (62 ms)
    √ retry apos erro de Descobrir repete discoverClubs (115 ms)
    √ retry apos erro de busca repete searchClubs sem apagar discovery carregado (116 ms)
    √ retry apos erro de busca recupera resultados reais (113 ms)
    √ refresh e retry nao chamam searchClubs fora da aba Descobrir (64 ms)

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        5.52 s
Ran all test suites matching /__tests__\\use-clubs-screen-test.tsx/i.
```

## Cenarios validados

- Meus Clubes carrega pelo servico real injetado.
- Refresh em Meus Clubes chama novamente `getMyClubs`.
- Busca, retry e refresh preservam os fluxos existentes.
- Atualizacoes locais de atividade nao quebram a lista.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao automatizada passou. O hook preserva o consumo real da lista de clubes e suporta atualizacao local de atividade.
