## Arquivo testado

`backend/tests/club-prompts.routes.test.ts`

## Escopo do relatorio

Validacao das rotas dedicadas de prompts de clube, incluindo autenticacao, publicacao de prompts, campos opcionais, autorizacao, erros padronizados e auditoria.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
PASS tests/club-prompts.routes.test.ts (35.155 s)
  club-prompts.routes
    √ retorna 401 sem token (1827 ms)
    √ POST /clubs/:id/prompts cria prompt de verdade autenticado (2454 ms)
    √ POST /clubs/:id/prompts cria desafio com campos opcionais (709 ms)
    √ bloqueia outsider com erro padronizado (567 ms)
    √ retorna 400 para dados invalidos (451 ms)
    √ retorna 404 para clube inexistente (224 ms)
    √ registra audit log na publicacao via rota (891 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        36.112 s
Ran all test suites matching /tests\\club-prompts.routes.test.ts/i.

Build TypeScript/Prisma: passou
```

## Validacao adicional

A suite foi executada em modo sequencial com `--runInBand`, usando reset do banco de testes. A compilacao completa do backend confirmou a integracao das novas rotas com a aplicacao Express.

## Cenarios validados

- Rejeicao de requisicao sem token.
- Publicacao autenticada de prompt de verdade.
- Publicacao autenticada de desafio com tentativas, prazo, dificuldade, destaque e anexo.
- Bloqueio de usuario fora do clube.
- Retorno de erro de validacao para payload invalido.
- Retorno de erro de clube inexistente.
- Registro de audit log na publicacao via rota.

## Interpretacao

As rotas dedicadas encaminham corretamente a publicacao de prompts para o servico de dominio, preservando autenticacao, padrao de erro e regras de permissao. A persistencia dos efeitos principais foi validada por consulta direta ao banco de testes.

## Conclusao

A publicacao de prompts de clube esta validada no nivel de rota, com cobertura para fluxo principal, campos opcionais, autorizacao, validacao e auditoria.
