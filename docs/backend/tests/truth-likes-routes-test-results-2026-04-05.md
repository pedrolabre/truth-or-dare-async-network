\## Arquivo testado



`backend/tests/truth-likes.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Bloqueio de acesso sem token na ação de like em truths



2\. Bloqueio de acesso com token mal formatado na ação de like em truths



3\. Bloqueio de acesso com token inválido na ação de like em truths



4\. Criação de like quando o usuário ainda não curtiu a truth



5\. Remoção de like quando o usuário já curtiu a truth



\## Resultado da execução



PASS  tests/truth-likes.routes.test.ts



&#x20; POST /truths/:id/like

&#x20;   √ deve retornar 401 quando o token não for informado (371 ms)

&#x20;   √ deve retornar 401 quando o token estiver mal formatado (11 ms)

&#x20;   √ deve retornar 401 quando o token for inválido (9 ms)

&#x20;   √ deve criar like quando o usuário ainda não curtiu a truth (314 ms)

&#x20;   √ deve remover like quando o usuário já curtiu a truth (305 ms)



Test Suites: 1 passed, 1 total

Tests:       5 passed, 5 total

Snapshots:   0 total

Time:        3.749 s

Ran all test suites within paths "tests/truth-likes.routes.test.ts".



\## Interpretação



Os testes automatizados confirmam que a rota de likes para truths está funcionando corretamente, garantindo controle de acesso e comportamento de toggle (curtir/descurtir).



Os testes garantem que:



\- o acesso à rota é protegido por autenticação



\- tokens inválidos, ausentes ou mal formatados são tratados corretamente



\- o sistema cria um like quando o usuário ainda não interagiu com a truth



\- o sistema remove o like quando o usuário já havia curtido anteriormente



\## Conclusão



A suíte `truth-likes.routes.test.ts` valida com sucesso o comportamento da funcionalidade de likes em truths, garantindo segurança de acesso e consistência na alternância entre curtir e descurtir.

