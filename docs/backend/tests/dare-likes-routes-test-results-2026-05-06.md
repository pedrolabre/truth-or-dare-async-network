## Arquivo testado

`backend/tests/dare-likes.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenários validados

1. Criação de like quando o usuário autenticado ainda não curtiu o dare

2. Remoção de like quando o usuário autenticado já curtiu o dare

## Resultado da execução

PASS  tests/dare-likes.routes.test.ts

  POST /dares/:id/like
    √ deve criar like quando o usuário ainda não curtiu o dare (710 ms)
    √ deve remover like quando já estiver curtido (250 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.269 s, estimated 3 s
Ran all test suites within paths "tests/dare-likes.routes.test.ts".

## Interpretação

Os testes automatizados confirmam que a rota de curtidas em dares está funcionando corretamente com o contrato atualizado de resposta, incluindo `liked` e `likesCount`.

Os testes garantem que:

- o sistema cria uma curtida real quando o usuário ainda não curtiu o dare

- o sistema remove a curtida quando o usuário chama novamente o endpoint para um dare já curtido

- o retorno do endpoint informa corretamente o estado `liked`

- o retorno do endpoint informa corretamente o contador atualizado `likesCount`

- a persistência das curtidas em dares continua compatível com o sistema genérico de likes

## Conclusão

A suíte `dare-likes.routes.test.ts` valida com sucesso a rota de curtidas em dares, garantindo alternância correta entre curtir e descurtir, persistência no banco e compatibilidade com o contrato atualizado de likes.
