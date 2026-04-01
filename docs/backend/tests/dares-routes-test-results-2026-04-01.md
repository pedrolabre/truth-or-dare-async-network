\# Resultados dos testes automatizados das rotas de dares



\## Arquivo testado



`backend/tests/dares.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Bloqueio de acesso sem token



2\. Bloqueio de acesso com token mal formatado



3\. Bloqueio de acesso com token inválido



4\. Criação de dare para usuário autenticado



5\. Validação de conteúdo obrigatório



\## Resultado da execução



```text

PASS  tests/dares.routes.test.ts (6.039 s)

&#x20; POST /dares

&#x20;   √ deve retornar 401 quando o token não for informado (763 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (17 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (13 ms)

&#x20;   √ deve criar um dare real no banco para usuário autenticado (202 ms)

&#x20;   √ deve retornar 400 quando o conteúdo não for informado (170 ms)



Test Suites: 1 passed, 1 total

Tests:       5 passed, 5 total

Snapshots:   0 total

Time:        6.62 s

Ran all test suites within paths "tests/dares.routes.test.ts".

```



\## Interpretação



Os testes automatizados confirmam que as rotas de criação de dares estão funcionando corretamente com integração completa entre:



\- autenticação via JWT



\- camada de controller



\- camada de service



\- banco de dados real (PostgreSQL via Prisma)



Os testes garantem que:



\- o acesso à criação de dares é devidamente protegido por autenticação



\- tokens inválidos ou ausentes são tratados corretamente



\- usuários autenticados conseguem criar conteúdos persistidos no banco



\- validações de entrada impedem a criação de dados inválidos



\- o sistema responde corretamente a requisições inválidas



\## Conclusão



A suíte `dares.routes.test.ts` valida com sucesso o comportamento das rotas de criação de dares, garantindo segurança de acesso, persistência correta dos dados e validação adequada das entradas, mantendo a consistência do backend com o restante do sistema.

