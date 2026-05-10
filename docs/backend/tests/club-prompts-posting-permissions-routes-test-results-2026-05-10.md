## Arquivo testado

`backend/tests/club-prompts-posting-permissions.routes.test.ts`

## Escopo do relatorio

Validacao das permissoes de postagem de prompts em clubes por endpoint autenticado, considerando papel do membro, status da membership e estado do clube.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
PASS tests/club-prompts-posting-permissions.routes.test.ts (14.489 s)
  POST /clubs/:id/prompts posting permissions
    √ permite postagem para owner ativo (1481 ms)
    √ permite postagem para admin ativo (392 ms)
    √ permite postagem para moderator ativo (302 ms)
    √ permite postagem para member ativo (269 ms)
    √ bloqueia postagem para membro com status invited (277 ms)
    √ bloqueia postagem para membro com status requested (293 ms)
    √ bloqueia postagem para membro com status removed (299 ms)
    √ bloqueia postagem para usuario fora do clube (232 ms)
    √ bloqueia postagem em clube archived (248 ms)
    √ bloqueia postagem em clube suspended (250 ms)
    √ trata clube deletado como inexistente para postagem (239 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        14.802 s
Ran all test suites matching /tests\\club-prompts-posting-permissions.routes.test.ts/i.

Build TypeScript/Prisma: passou
```

## Validacao adicional

A suite foi executada em modo sequencial com `--runInBand`, usando reset do banco de testes. A validacao confirmou os codigos HTTP e os codigos de erro retornados pela API para cenarios permitidos e bloqueados.

## Cenarios validados

- Postagem permitida para `owner` ativo.
- Postagem permitida para `admin` ativo.
- Postagem permitida para `moderator` ativo.
- Postagem permitida para `member` ativo.
- Postagem bloqueada para membership `invited`.
- Postagem bloqueada para membership `requested`.
- Postagem bloqueada para membership `removed`.
- Postagem bloqueada para usuario fora do clube.
- Postagem bloqueada em clube arquivado.
- Postagem bloqueada em clube suspenso.
- Clube deletado tratado como inexistente para postagem.

## Interpretacao

A publicacao de prompts respeita a matriz atual de permissoes do dominio de clubes. Apenas membros ativos de clubes ativos podem publicar, enquanto usuarios sem membership ativa ou clubes indisponiveis recebem erro padronizado.

## Conclusao

As permissoes de postagem de prompts em clubes estao validadas por endpoint, cobrindo papeis ativos, estados de membership e estados de clube.
