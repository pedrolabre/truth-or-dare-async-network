\## Arquivo testado



`backend/tests/feed.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Bloqueio de acesso sem token na rota de feed



2\. Bloqueio de acesso com token mal formatado na rota de feed



3\. Bloqueio de acesso com token inválido na rota de feed



4\. Retorno do feed real persistido no banco para usuário autenticado



5\. Manutenção do contrato compatível com o mobile



6\. Retorno de feed vazio quando não houver dados persistidos



\## Resultado da execução



PASS  tests/feed.routes.test.ts



&#x20; GET /feed

&#x20;   √ deve retornar 401 quando o token não for informado (330 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (12 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (13 ms)

&#x20;   √ deve retornar o feed real persistido no banco para usuário autenticado (529 ms)

&#x20;   √ deve manter o contrato compatível com o mobile (435 ms)

&#x20;   √ deve retornar feed vazio quando não houver dados persistidos (415 ms)



Test Suites: 1 passed, 1 total

Tests:       6 passed, 6 total

Snapshots:   0 total

Time:        5.058 s

Ran all test suites within paths "tests/feed.routes.test.ts".



\## Interpretação



Os testes automatizados confirmam que a rota de feed está funcionando corretamente, garantindo segurança de acesso e retorno consistente dos dados conforme o esperado pelo frontend.



Os testes garantem que:



\- o acesso à rota de feed é devidamente protegido por autenticação



\- tokens inválidos, ausentes ou mal formatados são tratados corretamente



\- usuários autenticados recebem o feed com dados reais persistidos no banco



\- o formato da resposta está compatível com o contrato esperado pelo mobile



\- o sistema lida corretamente com cenários sem dados, retornando um feed vazio



\## Conclusão



A suíte `feed.routes.test.ts` valida com sucesso o comportamento da rota de feed, garantindo segurança de acesso, integração com a camada de service e consistência no retorno dos dados para o frontend.

