## Arquivos testados

`mobile/__tests__/use-club-prompt-composer-test.tsx`

## Escopo do relatorio

Validacao automatizada do compositor de prompt do clube, cobrindo montagem de payload, permissao de postagem, validacao de conteudo e validacao de tentativas para desafio.

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
npm test -- --runInBand __tests__/use-club-prompt-composer-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/use-club-prompt-composer-test.tsx

PASS __tests__/use-club-prompt-composer-test.tsx (6.636 s)
  useClubPromptComposer
    √ monta payload e publica prompt quando permissao permite (113 ms)
    √ bloqueia envio sem permissao ou com tentativas invalidas (24 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        8.399 s
Ran all test suites matching /__tests__\\use-club-prompt-composer-test.tsx/i.
```

## Suites executadas

- `use-club-prompt-composer-test.tsx`: validacao do hook `useClubPromptComposer`.

## Cenarios validados

- Tipo de prompt pode ser alterado para desafio.
- Conteudo digitado e normalizado no payload.
- Dificuldade digitada e normalizada no payload.
- Tentativas maximas digitadas viram numero no payload.
- Prompt de desafio preserva `maxAttempts`.
- Payload inclui prazo nulo quando nenhum prazo foi definido.
- Payload preserva restricao a membros.
- Hook chama a funcao de postagem quando permissao permite.
- Conteudo e resetado apos sucesso.
- Sem permissao de postagem, envio fica bloqueado.
- Tentativas acima do limite geram mensagem de validacao.
- Tentativas invalidas impedem chamada de postagem.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

O compositor de prompt passou. O hook monta o payload esperado, respeita permissao e bloqueia envios invalidos.
