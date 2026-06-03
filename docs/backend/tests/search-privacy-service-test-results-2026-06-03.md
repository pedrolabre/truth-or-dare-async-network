## Arquivo testado

`backend/tests/search.service.test.ts`

## Escopo do relatorio

Validacao do servico backend de busca com regras de privacidade para usuarios privados, clubes privados e conteudos associados, mantendo filtros, paginacao, descoberta e contratos publicos ja existentes.

Data da execucao: 03/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/search.service.test.ts
```

Resultado:

```text
PASS tests/search.service.test.ts
  search.service
    [ok] rejeita busca vazia ou curta com erro padronizado
    [ok] rejeita busca longa com erro padronizado
    [ok] busca usuarios por nome, username e bio retornando somente campos publicos
    [ok] oculta usuario privado sem permissao e exibe quando ha clube ativo em comum
    [ok] retorna lista vazia quando nao ha resultados
    [ok] pagina resultados por cursor e offset
    [ok] filtra clubes por visibilidade, status publico e bloqueio do viewer
    [ok] exibe clube privado somente para membro ativo
    [ok] calcula mutualCount por clubes ativos em comum no schema atual
    [ok] calcula isTrending por crescimento de membros nas ultimas 48 horas
    [ok] aplica filtros de nivel minimo e maximo de usuarios
    [ok] aplica filtro de usuarios online usando atividade recente em clube ativo
    [ok] aplica filtros de visibilidade publica e tag de clube sem vazar clubes privados
    [ok] busca conteudo em verdades, desafios e comentarios permitidos
    [ok] retorna conteudo vazio sem resultados
    [ok] exclui conteudo de clube privado, removido, expirado e bloqueado
    [ok] oculta conteudo de usuarios privados e permite conteudo de clube privado para membro ativo
    [ok] traduz falhas de persistencia para SEARCH_UNAVAILABLE
    [ok] recomenda usuarios por clubes ativos em comum e atividade recente
    [ok] retorna recomendados vazio quando nao ha candidatos
    [ok] retorna clubes em alta por crescimento, atividade e prompts recentes
    [ok] retorna clubes em alta vazio quando nao ha clubes elegiveis

Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
```

## Cenarios validados

- Usuarios privados nao aparecem para viewers sem permissao.
- Usuarios privados aparecem quando ha clube ativo em comum.
- Clubes privados aparecem somente para membro ativo.
- Conteudo de usuario privado e ocultado de viewer sem permissao.
- Conteudo de clube privado e ocultado de outsider e permitido para membro ativo.
- Busca continua retornando somente campos publicos e paginacao por `cursor`/`limit`.
- Filtros e descoberta existentes continuam funcionando.

## Interpretacao

A suite confirma que a politica de privacidade aplicada no servico de busca evita vazamento de usuarios privados, clubes privados e conteudos relacionados. Os contratos publicos continuam enxutos e sem `email`, `passwordHash` ou campos internos.

## Conclusao

O servico backend de busca foi validado com sucesso para privacidade, paginacao, filtros e contratos publicos.
