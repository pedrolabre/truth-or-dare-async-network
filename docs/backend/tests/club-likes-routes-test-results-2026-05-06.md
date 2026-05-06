## Arquivo testado

`backend/tests/club-likes.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenários validados

1. Criação de like quando o usuário autenticado ainda não curtiu o prompt de club

2. Remoção de like quando o usuário autenticado já curtiu o prompt de club

## Resultado da execução

PASS  tests/club-likes.routes.test.ts

  POST /clubs/:id/like
    √ deve criar like quando o usuário ainda não curtiu o club prompt (707 ms)
    √ deve remover like quando já estiver curtido (239 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.293 s
Ran all test suites within paths "tests/club-likes.routes.test.ts".

## Interpretação

Os testes automatizados confirmam que a rota de curtidas em prompts de club está funcionando corretamente com o contrato atualizado de resposta, incluindo `liked` e `likesCount`.

Os testes garantem que:

- o sistema cria uma curtida real quando o usuário ainda não curtiu o prompt de club

- o sistema remove a curtida quando o usuário chama novamente o endpoint para um prompt de club já curtido

- o retorno do endpoint informa corretamente o estado `liked`

- o retorno do endpoint informa corretamente o contador atualizado `likesCount`

- a persistência das curtidas em prompts de club continua compatível com o sistema genérico de likes

## Conclusão

A suíte `club-likes.routes.test.ts` valida com sucesso a rota de curtidas em prompts de club, garantindo alternância correta entre curtir e descurtir, persistência no banco e compatibilidade com o contrato atualizado de likes.
