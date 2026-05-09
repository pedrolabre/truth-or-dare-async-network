## Arquivo testado

`backend/tests/clubs.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenários validados

1. Retorno de `401` quando o token de autenticação não é informado

2. Criação de clube autenticado com owner automático e membro inicial

3. Retorno de erro padronizado de validação ao criar clube com payload inválido

4. Listagem de clubes do usuário autenticado, descoberta de clubes públicos e busca textual

5. Retorno de detalhe de clube público e bloqueio de clube privado para usuário sem membership

6. Autorização de owner para edição, arquivamento e restauração de clube

## Resultado da execução

PASS  tests/clubs.routes.test.ts

  clubs.routes
    √ retorna 401 sem token (367 ms)
    √ POST /clubs cria clube autenticado com owner e membro inicial (365 ms)
    √ POST /clubs retorna erro padronizado de validacao (114 ms)
    √ GET /clubs/my, /discover e /search retornam listas do usuario (351 ms)
    √ GET /clubs/:id retorna detalhe e bloqueia clube privado para outsider (307 ms)
    √ PATCH, DELETE e POST /restore respeitam autorizacao de owner (279 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        5.571 s
Ran all test suites matching /tests\\clubs.routes.test.ts/i.

## Interpretação

Os testes automatizados confirmam que as rotas REST de clubes estão funcionando corretamente para os fluxos iniciais do CRUD autenticado.

Os testes garantem que:

- as rotas protegidas rejeitam requisições sem token

- `POST /clubs` cria um clube real com o criador como `owner` e membro ativo

- membros iniciais enviados na criação são persistidos como memberships do clube

- payloads inválidos retornam erro padronizado com `CLUB_VALIDATION_ERROR`

- `GET /clubs/my` retorna clubes associados ao usuário autenticado com membership

- `GET /clubs/discover` retorna clubes públicos sugeridos

- `GET /clubs/search` encontra clubes públicos por query textual

- `GET /clubs/:id` retorna detalhe de clube público para usuário autenticado

- clubes privados bloqueiam usuários sem membership com `CLUB_FORBIDDEN`

- membros comuns não conseguem editar clube

- owner consegue editar, arquivar e restaurar clube

## Conclusão

A suíte `clubs.routes.test.ts` valida com sucesso o contrato HTTP inicial de clubes, cobrindo autenticação, criação, validação, listagens, busca, detalhe, autorização, arquivamento e restauração.
