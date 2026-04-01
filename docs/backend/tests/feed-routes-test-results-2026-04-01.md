\# Resultados dos testes automatizados das rotas de feed



\## Arquivo testado

`backend/tests/feed.routes.test.ts`



\## Ferramentas utilizadas

\- Jest

\- Supertest

\- Prisma

\- PostgreSQL



\## Cenários validados

1\. Bloqueio de acesso sem token

2\. Bloqueio de acesso com token mal formatado

3\. Bloqueio de acesso com token inválido

4\. Retorno do feed real para usuário autenticado

5\. Compatibilidade do contrato da API com o mobile

6\. Retorno de feed vazio quando não houver dados persistidos



\## Resultado da execução

```text

PASS  tests/feed.routes.test.ts

&#x20; GET /feed

&#x20;   √ deve retornar 401 quando o token não for informado (273 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (11 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (9 ms)

&#x20;   √ deve retornar o feed real persistido no banco para usuário autenticado (442 ms)

&#x20;   √ deve manter o contrato compatível com o mobile (358 ms)

&#x20;   √ deve retornar feed vazio quando não houver dados persistidos (292 ms)



Test Suites: 1 passed, 1 total

Tests:       6 passed, 6 total

Snapshots:   0 total

Time:        4.327 s

Ran all test suites matching /tests\\\\feed.routes.test.ts/i.

```



\## Interpretação

Os testes automatizados confirmam que as rotas do feed estão funcionando corretamente com integração completa entre:

\- autenticação via JWT

\- camada de controller

\- camada de service

\- banco de dados real (PostgreSQL via Prisma)



Os testes garantem que:

\- o acesso ao feed é devidamente protegido por autenticação

\- tokens inválidos ou ausentes são tratados corretamente

\- usuários autenticados recebem dados reais persistidos

\- o formato da resposta permanece compatível com o consumo do mobile

\- o sistema responde corretamente quando não há dados disponíveis



\## Conclusão

A suíte `feed.routes.test.ts` valida com sucesso o comportamento das rotas do feed, garantindo segurança de acesso, integridade dos dados retornados e consistência do contrato com o frontend mobile.

