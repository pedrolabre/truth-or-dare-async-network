\# Resultados dos testes automatizados das rotas de usuários



\## Arquivo testado



`backend/tests/users.routes.test.ts`



\## Ferramentas utilizadas



\- Jest

\- Supertest

\- Prisma

\- PostgreSQL



\## Cenários validados



1\. Listagem de usuários autenticado com sucesso sem retornar o próprio usuário

2\. Filtragem de usuários pela query

3\. Bloqueio de acesso quando não houver token



\## Resultado da execução



```text

PASS  tests/users.routes.test.ts

&#x20; users.routes

&#x20;   √ deve listar usuários autenticado com sucesso sem retornar o próprio usuário (577 ms)

&#x20;   √ deve filtrar usuários pela query (251 ms)

&#x20;   √ deve retornar 401 quando não houver token (18 ms)



Test Suites: 1 passed, 1 total

Tests:       3 passed, 3 total

Snapshots:   0 total

Time:        5.218 s

Ran all test suites matching /users.routes.test.ts/i.

```



\## Interpretação



Os testes automatizados confirmam que as rotas de usuários estão funcionando corretamente com integração completa entre:



\- autenticação via JWT

\- camada de controller

\- camada de service

\- banco de dados real (PostgreSQL via Prisma)



Os testes garantem que:



\- o endpoint de listagem de usuários é protegido por autenticação

\- requisições sem token são corretamente bloqueadas com erro 401

\- usuários autenticados conseguem acessar a lista de usuários

\- o usuário autenticado não é retornado na listagem

\- a filtragem por query funciona corretamente na camada HTTP

\- a resposta da API está consistente com o consumo esperado pelo frontend



\## Conclusão



A suíte `users.routes.test.ts` valida com sucesso o comportamento das rotas de usuários, garantindo segurança de acesso, integração correta entre camadas e consistência dos dados retornados para o frontend.

