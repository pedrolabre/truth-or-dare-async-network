\# Resultados dos testes automatizados das rotas de truths



\## Arquivo testado



`backend/tests/truths.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Bloqueio de acesso sem token



2\. Bloqueio de acesso com token mal formatado



3\. Bloqueio de acesso com token inválido



4\. Criação de truth para usuário autenticado com persistência de `targetUserId`



5\. Validação de `targetUserId` obrigatório



6\. Validação de conteúdo obrigatório



\## Resultado da execução



```text

PASS  tests/truths.routes.test.ts (5.372 s)

&#x20; POST /truths

&#x20;   √ deve retornar 401 quando o token não for informado (480 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (13 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (11 ms)

&#x20;   √ deve criar uma truth real no banco para usuário autenticado com targetUserId persistido (384 ms)

&#x20;   √ deve retornar 400 quando o targetUserId não for informado (106 ms)

&#x20;   √ deve retornar 400 quando o conteúdo não for informado (160 ms)



Test Suites: 1 passed, 1 total

Tests:       6 passed, 6 total

Snapshots:   0 total

Time:        5.836 s

Ran all test suites within paths "tests/truths.routes.test.ts".

```



\## Interpretação



Os testes automatizados confirmam que as rotas de criação de truths estão funcionando corretamente com integração completa entre:



\- autenticação via JWT



\- camada de controller



\- camada de service



\- banco de dados real (PostgreSQL via Prisma)



Os testes garantem que:



\- o acesso à criação de truths é devidamente protegido por autenticação



\- tokens inválidos ou ausentes são tratados corretamente



\- usuários autenticados conseguem criar conteúdos persistidos no banco



\- o usuário-alvo (`targetUserId`) é persistido corretamente junto com a truth



\- a ausência de `targetUserId` é tratada como erro de validação



\- validações de entrada impedem a criação de dados inválidos



\- o sistema responde corretamente a requisições inválidas



\## Conclusão



A suíte `truths.routes.test.ts` valida com sucesso o comportamento das rotas de criação de truths, garantindo segurança de acesso, persistência correta dos dados, validação adequada das entradas e consistência da nova relação com o usuário-alvo no backend.

