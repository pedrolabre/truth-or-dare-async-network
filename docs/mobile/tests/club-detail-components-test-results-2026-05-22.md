## Arquivos testados

`mobile/__tests__/club-detail-components-test.tsx`

## Escopo do relatorio

Validacao automatizada dos componentes visuais do detalhe do clube, cobrindo o card de identidade e a barra de acoes por estado de membership e permissao.

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
npm test -- --runInBand __tests__/club-detail-components-test.tsx
```

## Resultado da execucao

Saida do terminal:

```text
> mobile@1.0.0 test
> jest --runInBand __tests__/club-detail-components-test.tsx

PASS __tests__/club-detail-components-test.tsx (7.971 s)
  club detail components
    √ renderiza header com identidade, badges, tags e contadores (92 ms)
    √ mostra entrada para visitante publico e oculta acoes administrativas (236 ms)
    √ mostra acoes de owner/admin conforme permissoes (13 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        8.721 s
Ran all test suites matching /__tests__\\club-detail-components-test.tsx/i.
```

## Suites executadas

- `club-detail-components-test.tsx`: validacao de `ClubHeaderCard` e `ClubActionBar`.

## Cenarios validados

- Header renderiza nome do clube.
- Header renderiza descricao do clube.
- Header renderiza badge de status.
- Header renderiza badge de privacidade.
- Header renderiza papel do usuario.
- Header renderiza tags retornadas pelo detalhe.
- Header renderiza contador de membros.
- Header renderiza contador de prompts.
- Visitante de clube publico visualiza a acao de entrada.
- Visitante sem permissao administrativa nao visualiza configuracoes.
- Visitante sem permissao administrativa nao visualiza convite.
- Visitante sem permissao de postagem nao visualiza postagem.
- Owner/admin com permissao visualiza acao de postagem.
- Owner/admin com permissao visualiza acao de convite.
- Owner/admin com permissao visualiza acao de configuracoes.
- Membro visualiza acao de sair.
- Membro visualiza acao de silenciar.
- Cada botao validado chama o handler recebido por props.

## Observacoes

O teste usa mock de `@expo/vector-icons` para renderizar os nomes dos icones como texto durante a execucao em Jest.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador ou navegador.

## Conclusao

A validacao dos componentes de identidade e acoes passou. Os componentes renderizam as informacoes principais do clube e ocultam ou exibem acoes conforme membership e permissoes recebidas.
