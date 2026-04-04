\# Resultados dos testes automatizados das rotas de truths



\## Arquivo testado



`backend/tests/truths.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Bloqueio de acesso sem token na criação de truths



2\. Bloqueio de acesso com token mal formatado na criação de truths



3\. Bloqueio de acesso com token inválido na criação de truths



4\. Criação de truth com persistência de `targetUserId`



5\. Validação de `targetUserId` obrigatório



6\. Validação de conteúdo obrigatório



7\. Bloqueio de acesso sem token na deleção de truths



8\. Bloqueio de acesso com token mal formatado na deleção de truths



9\. Bloqueio de acesso com token inválido na deleção de truths



10\. Deleção de truth pelo próprio autor



11\. Tratamento de truth inexistente na deleção



12\. Bloqueio de deleção de truth por usuário não autorizado



\## Resultado da execução



```text

PASS  tests/truths.routes.test.ts (8.843 s)

&#x20; POST /truths

&#x20;   √ deve retornar 401 quando o token não for informado (588 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (18 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (13 ms)

&#x20;   √ deve criar uma truth real no banco para usuário autenticado com targetUserId persistido (423 ms)

&#x20;   √ deve retornar 400 quando o targetUserId não for informado (146 ms)

&#x20;   √ deve retornar 400 quando o conteúdo não for informado (197 ms)

&#x20; DELETE /truths/:id

&#x20;   √ deve retornar 401 quando o token não for informado (130 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (14 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (15 ms)

&#x20;   √ deve deletar uma truth do próprio autor (259 ms)

&#x20;   √ deve retornar 400 quando a truth não existir (142 ms)

&#x20;   √ deve retornar 400 quando o usuário tentar deletar truth de outro autor (358 ms)



Test Suites: 1 passed, 1 total

Tests:       12 passed, 12 total

Snapshots:   0 total

Time:        9.369 s

Ran all test suites within paths "tests/truths.routes.test.ts".

```



\## Interpretação



Os testes automatizados confirmam que as rotas de truths estão funcionando corretamente tanto para criação quanto para deleção, com integração completa entre:



\- autenticação via JWT



\- camada de controller



\- camada de service



\- banco de dados real (PostgreSQL via Prisma)



Os testes garantem que:



\- o acesso às rotas de truths é devidamente protegido por autenticação



\- tokens inválidos, ausentes ou mal formatados são tratados corretamente



\- usuários autenticados conseguem criar truths válidas com persistência do usuário-alvo (`targetUserId`)



\- validações de entrada impedem a criação de dados inválidos



\- o autor consegue deletar a própria truth com sucesso



\- a deleção de truths inexistentes é tratada corretamente



\- usuários não autorizados não conseguem deletar truths de outros autores



\## Conclusão



A suíte `truths.routes.test.ts` valida com sucesso o comportamento das rotas de criação e deleção de truths, garantindo segurança de acesso, persistência correta dos dados, validação adequada das entradas e controle de autorização nas operações destrutivas.

