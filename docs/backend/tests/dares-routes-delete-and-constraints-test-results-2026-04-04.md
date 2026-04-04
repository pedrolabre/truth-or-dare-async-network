\# Resultados dos testes automatizados das rotas de dares



\## Arquivo testado



`backend/tests/dares.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Bloqueio de acesso sem token na criação de dares



2\. Bloqueio de acesso com token mal formatado na criação de dares



3\. Bloqueio de acesso com token inválido na criação de dares



4\. Criação de dare com persistência de `targetUserId`



5\. Criação de dare com `maxAttempts` e `expiresAt` customizados



6\. Validação de `targetUserId` obrigatório



7\. Validação de conteúdo obrigatório



8\. Validação de `maxAttempts` inválido



9\. Validação de `expiresAt` inválido



10\. Bloqueio de acesso sem token na deleção de dares



11\. Bloqueio de acesso com token mal formatado na deleção de dares



12\. Bloqueio de acesso com token inválido na deleção de dares



13\. Deleção de dare pelo próprio autor



14\. Tratamento de dare inexistente na deleção



15\. Bloqueio de deleção de dare por usuário não autorizado



\## Resultado da execução



```text

PASS  tests/dares.routes.test.ts (8.354 s)

&#x20; POST /dares

&#x20;   √ deve retornar 401 quando o token não for informado (394 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (15 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (13 ms)

&#x20;   √ deve criar um dare real no banco para usuário autenticado com targetUserId persistido (320 ms)

&#x20;   √ deve criar um dare com maxAttempts e expiresAt customizados (254 ms)

&#x20;   √ deve retornar 400 quando o targetUserId não for informado (102 ms)

&#x20;   √ deve retornar 400 quando o conteúdo não for informado (181 ms)

&#x20;   √ deve retornar 400 quando maxAttempts for inválido (183 ms)

&#x20;   √ deve retornar 400 quando expiresAt for inválido (152 ms)

&#x20; DELETE /dares/:id

&#x20;   √ deve retornar 401 quando o token não for informado (122 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (13 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (13 ms)

&#x20;   √ deve deletar um dare do próprio autor (303 ms)

&#x20;   √ deve retornar 400 quando o dare não existir (111 ms)

&#x20;   √ deve retornar 400 quando o usuário tentar deletar dare de outro autor (269 ms)



Test Suites: 1 passed, 1 total

Tests:       15 passed, 15 total

Snapshots:   0 total

Time:        8.904 s

Ran all test suites within paths "tests/dares.routes.test.ts".

```



\## Interpretação



Os testes automatizados confirmam que as rotas de dares estão funcionando corretamente tanto para criação quanto para deleção, com integração completa entre:



\- autenticação via JWT



\- camada de controller



\- camada de service



\- banco de dados real (PostgreSQL via Prisma)



Os testes garantem que:



\- o acesso às rotas de dares é devidamente protegido por autenticação



\- tokens inválidos, ausentes ou mal formatados são tratados corretamente



\- usuários autenticados conseguem criar dares válidos com persistência do usuário-alvo (`targetUserId`)



\- a configuração de `maxAttempts` e `expiresAt` é aceita e persistida corretamente



\- validações de entrada impedem a criação de dados inválidos



\- o autor consegue deletar o próprio dare com sucesso



\- a deleção de dares inexistentes é tratada corretamente



\- usuários não autorizados não conseguem deletar dares de outros autores



\## Conclusão



A suíte `dares.routes.test.ts` valida com sucesso o comportamento das rotas de criação e deleção de dares, garantindo segurança de acesso, persistência correta dos dados, validação adequada das entradas, suporte às configurações avançadas do desafio e controle de autorização nas operações destrutivas.

