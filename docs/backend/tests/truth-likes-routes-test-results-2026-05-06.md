## Arquivo testado

`backend/tests/truth-likes.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenários validados

1. Rejeição da curtida em truth quando o token não é informado

2. Rejeição da curtida em truth quando o token está mal formatado

3. Rejeição da curtida em truth quando o token é inválido

4. Criação de like quando o usuário autenticado ainda não curtiu a truth

5. Remoção de like quando o usuário autenticado já curtiu a truth

## Resultado da execução

PASS  tests/truth-likes.routes.test.ts

  POST /truths/:id/like
    √ deve retornar 401 quando o token não for informado (276 ms)
    √ deve retornar 401 quando o token estiver mal formatado (12 ms)
    √ deve retornar 401 quando o token for inválido (10 ms)
    √ deve criar like quando o usuário ainda não curtiu a truth (320 ms)
    √ deve remover like quando o usuário já curtiu a truth (245 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        2.384 s
Ran all test suites within paths "tests/truth-likes.routes.test.ts".

## Interpretação

Os testes automatizados confirmam que a rota de curtidas em truths está funcionando corretamente com o contrato atualizado de resposta, incluindo `liked` e `likesCount`.

Os testes garantem que:

- o endpoint exige autenticação para permitir curtidas em truths

- tokens ausentes, mal formatados ou inválidos são rejeitados

- o sistema cria uma curtida real quando o usuário ainda não curtiu a truth

- o sistema remove a curtida quando o usuário chama novamente o endpoint para uma truth já curtida

- o retorno do endpoint informa corretamente o estado `liked` e o contador atualizado `likesCount`

## Conclusão

A suíte `truth-likes.routes.test.ts` valida com sucesso a rota de curtidas em truths, garantindo autenticação, alternância correta entre curtir e descurtir, persistência no banco e compatibilidade com o contrato atualizado de likes.
