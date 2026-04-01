\# Resultados dos testes automatizados de autenticação



\## Arquivo testado

`backend/tests/auth.test.ts`



\## Ferramentas utilizadas

\- Jest

\- Supertest

\- Prisma

\- PostgreSQL



\## Cenários validados

1\. Cadastro de usuário com sucesso

2\. Bloqueio de cadastro com e-mail duplicado

3\. Login com credenciais válidas

4\. Bloqueio de login com senha incorreta

5\. Bloqueio de login para usuário inexistente



\## Resultado da execução

```text

PASS  tests/auth.test.ts

&#x20; Auth

&#x20;   √ deve cadastrar um usuário com sucesso

&#x20;   √ não deve permitir cadastro com e-mail duplicado

&#x20;   √ deve fazer login com sucesso

&#x20;   √ deve falhar no login com senha incorreta

&#x20;   √ deve falhar no login quando o usuário não existir



Test Suites: 1 passed, 1 total

Tests:       5 passed, 5 total

Snapshots:   0 total

Time:        execução validada dentro da suíte completa

Ran all test suites.

```



\## Interpretação

Os testes automatizados confirmam que o backend de autenticação está funcionando corretamente nos principais fluxos esperados:

\- o endpoint de cadastro cria usuários válidos com sucesso

\- o sistema impede duplicidade de e-mail

\- o endpoint de login autentica credenciais corretas

\- o sistema rejeita tentativas de login com senha incorreta

\- o sistema rejeita tentativas de login para usuários inexistentes



Os testes utilizam integração real com o banco de dados (PostgreSQL) via Prisma, sem dependência de mocks fixos, garantindo maior confiabilidade do comportamento em ambiente próximo ao real.



\## Conclusão

A suíte `auth.test.ts` validou com sucesso os fluxos essenciais de autenticação do backend, cobrindo cadastro, proteção contra duplicidade e regras completas de login com dados reais persistidos no banco.

