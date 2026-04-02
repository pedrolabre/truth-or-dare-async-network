\# Resultados dos testes de integração de usuários



\## Arquivo testado



`backend/tests/users.integration.test.ts`



\## Ferramentas utilizadas



\- Jest

\- Supertest

\- Prisma

\- PostgreSQL



\## Cenários validados



1\. Fluxo completo de listagem de usuários autenticado

2\. Fluxo completo de busca de usuários com query

3\. Garantia de não retorno de usuários inexistentes



\## Resultado da execução



```text

PASS  tests/users.integration.test.ts

&#x20; users.integration

&#x20;   √ fluxo completo: listar usuários autenticado (691 ms)

&#x20;   √ fluxo completo: busca com query (256 ms)

&#x20;   √ fluxo completo: não retorna usuários inexistentes (171 ms)



Test Suites: 1 passed, 1 total

Tests:       3 passed, 3 total

Snapshots:   0 total

Time:        4.981 s

Ran all test suites matching /users.integration.test.ts/i.

```



\## Interpretação



Os testes de integração confirmam que o fluxo completo de listagem de usuários está funcionando corretamente, conectando todas as camadas do sistema:



\- rota HTTP (`GET /users`)

\- autenticação via JWT

\- controller

\- service

\- persistência e leitura no banco PostgreSQL via Prisma



Os testes garantem que:



\- um usuário autenticado consegue listar outros usuários reais persistidos no banco

\- o sistema aplica corretamente a filtragem por query em nível de integração

\- o usuário autenticado não aparece na própria listagem

\- resultados inexistentes são tratados corretamente (retorno vazio)

\- não há quebra de integração entre as camadas do backend



\## Conclusão



A suíte `users.integration.test.ts` valida com sucesso o fluxo completo de listagem de usuários, garantindo consistência entre autenticação, regras de negócio e acesso ao banco de dados, assegurando que o backend suporta corretamente o comportamento esperado pelo frontend na seleção de usuários.

