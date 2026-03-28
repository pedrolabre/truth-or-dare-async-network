# Resultados dos testes automatizados de autenticação

## Arquivo testado
`backend/tests/auth.test.ts`

## Ferramentas utilizadas
- Jest
- Supertest

## Cenários validados
1. Cadastro de usuário com sucesso
2. Bloqueio de cadastro com e-mail duplicado
3. Login com credenciais válidas
4. Bloqueio de login com senha inválida

## Resultado da execução
```text
PASS  tests/auth.test.ts (10.364 s)
  Auth
    √ should signup successfully (1312 ms)
    √ should not allow duplicate email (27 ms)
    √ should login successfully (256 ms)
    √ should fail login with wrong password (248 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        11.087 s
Ran all test suites.
```

## Interpretação
Os testes automatizados confirmam que o backend de autenticação está funcionando corretamente nos principais fluxos esperados:
- o endpoint de cadastro cria usuários válidos
- o sistema impede duplicidade de e-mail
- o endpoint de login autentica credenciais corretas
- o sistema rejeita senha inválida

## Conclusão
A suíte `auth.test.ts` validou com sucesso os fluxos essenciais de autenticação do backend.
