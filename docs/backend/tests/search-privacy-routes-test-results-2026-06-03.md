## Arquivo testado

`backend/tests/search.routes.test.ts`

## Escopo do relatorio

Validacao HTTP dos endpoints de busca autenticada, cobrindo contratos publicos, paginacao, filtros, logs seguros e privacidade para contas privadas, clubes privados e conteudos privados.

Data da execucao: 03/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/search.routes.test.ts
```

Resultado:

```text
PASS tests/search.routes.test.ts
  search.routes
    [ok] exige autenticacao nos endpoints de busca
    [ok] retorna erro padronizado para query curta
    [ok] retorna erro padronizado para query longa
    [ok] GET /search/users retorna usuarios com contrato publico
    [ok] GET /search/users oculta contas privadas sem permissao
    [ok] GET /search/users retorna lista vazia sem resultados
    [ok] GET /search/users pagina por cursor
    [ok] GET /search/clubs retorna clubes com contrato publico
    [ok] GET /search/clubs retorna lista vazia sem resultados
    [ok] GET /search/clubs pagina por cursor
    [ok] GET /search/clubs aplica filtros de visibilidade e status
    [ok] GET /search/clubs permite clube privado apenas para membro ativo
    [ok] GET /search retorna payload unificado com paginacao por categoria
    [ok] GET /search/users aplica filtros de nivel e onlineOnly
    [ok] GET /search/clubs aplica filtros de visibilidade publica e tag
    [ok] GET /search/content retorna conteudo permitido com contrato publico
    [ok] GET /search/content retorna vazio sem resultados
    [ok] GET /search/content exclui conteudo privado, removido e indisponivel
    [ok] GET /search/content oculta conteudo de usuario privado ou clube privado sem permissao
    [ok] registra logs estruturados seguros para buscas por tipo sem expor termo bruto ou dados privados
    [ok] GET /search/recommended/users retorna recomendados com contrato publico
    [ok] GET /search/recommended/users retorna array vazio estavel sem dados suficientes
    [ok] GET /search/trending/clubs retorna clubes publicos ativos em alta
    [ok] GET /search/trending/clubs nao retorna clubes privados, inativos ou bloqueados para o viewer
    [ok] GET /search/trending/clubs retorna array vazio estavel sem clubes elegiveis
    [ok] traduz erro do servico para resposta HTTP padronizada

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```

## Cenarios validados

- Endpoints de busca exigem autenticacao.
- Contas privadas nao aparecem nos resultados HTTP sem permissao.
- Clubes privados aparecem somente para membro ativo.
- Conteudo privado nao aparece para viewer sem permissao.
- Logs `search.query_executed` nao incluem termo bruto, e-mail, token, `Authorization` ou `passwordHash`.
- Paginacao e filtros retornam contratos estaveis.

## Interpretacao

A suite confirma que as regras de privacidade do servico chegam corretamente aos endpoints HTTP e que os logs continuam registrando apenas metadados seguros, como tamanho da query, contagem de resultados e presenca de cursor.

## Conclusao

As rotas backend de busca foram validadas com sucesso para autenticacao, privacidade, paginacao, filtros, payload enxuto e logs seguros.
