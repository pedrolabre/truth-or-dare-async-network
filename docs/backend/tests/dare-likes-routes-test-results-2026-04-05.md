\## Arquivo testado



`backend/tests/dare-likes.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Criação de like quando o usuário ainda não curtiu o dare



2\. Remoção de like quando o dare já estiver curtido



\## Resultado da execução



PASS  tests/dare-likes.routes.test.ts



&#x20; POST /dares/:id/like

&#x20;   √ deve criar like quando o usuário ainda não curtiu o dare (749 ms)

&#x20;   √ deve remover like quando já estiver curtido (251 ms)



Test Suites: 1 passed, 1 total

Tests:       2 passed, 2 total

Snapshots:   0 total

Time:        3.804 s

Ran all test suites within paths "tests/dare-likes.routes.test.ts".



\## Interpretação



Os testes automatizados confirmam que a rota de likes para dares está funcionando corretamente, garantindo o comportamento de alternância entre curtir e remover curtida.



Os testes garantem que:



\- o sistema cria um like quando o usuário ainda não curtiu o dare



\- o sistema remove o like quando o usuário já havia curtido anteriormente



\## Conclusão



A suíte `dare-likes.routes.test.ts` valida com sucesso a funcionalidade de likes em dares, garantindo consistência no comportamento de toggle e persistência correta das interações.

