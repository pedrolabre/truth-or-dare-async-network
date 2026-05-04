## Arquivo testado

`backend/tests/auth.test.ts`

## Ferramentas utilizadas

- Jest

- Supertest

- Prisma

- PostgreSQL

## Cenários validados

1. Cadastro de usuário com sucesso

2. Bloqueio de cadastro com e-mail duplicado

3. Login com sucesso

4. Falha no login com senha incorreta

5. Falha no login quando o usuário não existe

## Resultado da execução

PASS  tests/auth.test.ts

  Auth

    √ deve cadastrar um usuário com sucesso (556 ms)

    √ não deve permitir cadastro com e-mail duplicado (113 ms)

    √ deve fazer login com sucesso (190 ms)

    √ deve falhar no login com senha incorreta (165 ms)

    √ deve falhar no login quando o usuário não existir (18 ms)

Test Suites: 1 passed, 1 total

Tests:       5 passed, 5 total

Snapshots:   0 total

Time:        3.087 s

Ran all test suites within paths "tests/auth.test.ts".

## Interpretação

Os testes automatizados confirmam que o fluxo de autenticação está funcionando corretamente, cobrindo tanto os cenários de sucesso quanto os principais cenários de falha.

Os testes garantem que:

- o sistema permite cadastrar um novo usuário com dados válidos

- o sistema impede cadastro duplicado com o mesmo e-mail

- o sistema permite login com credenciais corretas

- o sistema rejeita login com senha incorreta

- o sistema rejeita login de usuário inexistente

## Conclusão

A suíte `auth.test.ts` valida com sucesso os principais comportamentos de autenticação do backend, garantindo consistência no cadastro, no login e nas validações de credenciais inválidas.
