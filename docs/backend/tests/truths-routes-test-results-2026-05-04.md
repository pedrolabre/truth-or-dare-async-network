## Arquivo testado

`backend/tests/truths.routes.test.ts`

## Ferramentas utilizadas

- Jest

- Supertest

- Prisma

- PostgreSQL

## Cenários validados

1. Retorno de erro 401 ao tentar criar uma truth sem token

2. Retorno de erro 401 ao tentar criar uma truth com token mal formatado

3. Retorno de erro 401 ao tentar criar uma truth com token inválido

4. Criação de uma truth real no banco para usuário autenticado com `targetUserId` persistido

5. Retorno de erro 400 quando o `targetUserId` não é informado

6. Retorno de erro 400 quando o conteúdo da truth não é informado

7. Retorno de erro 401 ao tentar deletar uma truth sem token

8. Retorno de erro 401 ao tentar deletar uma truth com token mal formatado

9. Retorno de erro 401 ao tentar deletar uma truth com token inválido

10. Exclusão de uma truth pelo próprio autor

11. Retorno de erro 400 quando a truth informada não existe

12. Retorno de erro 400 quando o usuário tenta deletar uma truth criada por outro autor

## Resultado da execução

PASS  tests/truths.routes.test.ts

  POST /truths
    √ deve retornar 401 quando o token não for informado (443 ms)
    √ deve retornar 401 quando o token estiver mal formatado (18 ms)
    √ deve retornar 401 quando o token for inválido (16 ms)
    √ deve criar uma truth real no banco para usuário autenticado com targetUserId persistido (420 ms)
    √ deve retornar 400 quando o targetUserId não for informado (103 ms)
    √ deve retornar 400 quando o conteúdo não for informado (169 ms)

  DELETE /truths/:id
    √ deve retornar 401 quando o token não for informado (212 ms)
    √ deve retornar 401 quando o token estiver mal formatado (11 ms)
    √ deve retornar 401 quando o token for inválido (11 ms)
    √ deve deletar uma truth do próprio autor (194 ms)
    √ deve retornar 400 quando a truth não existir (84 ms)
    √ deve retornar 400 quando o usuário tentar deletar truth de outro autor (287 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        4.142 s
Ran all test suites within paths "tests/truths.routes.test.ts".

## Interpretação

Os testes automatizados confirmam que as rotas de truths estão funcionando corretamente para criação e exclusão de perguntas do tipo truth.

Os testes garantem que:

- a criação de truth exige autenticação válida

- tokens ausentes, mal formatados ou inválidos são rejeitados

- uma truth pode ser criada e persistida corretamente com `targetUserId`

- o backend valida a obrigatoriedade do usuário alvo

- o backend valida a obrigatoriedade do conteúdo

- a exclusão de truth exige autenticação válida

- o autor pode deletar sua própria truth

- uma truth inexistente não pode ser deletada

- um usuário não pode deletar uma truth criada por outro autor

## Conclusão

A suíte `truths.routes.test.ts` valida com sucesso as rotas de criação e exclusão de truths, garantindo autenticação, validações de entrada, persistência correta com usuário alvo e controle de autoria na exclusão.
