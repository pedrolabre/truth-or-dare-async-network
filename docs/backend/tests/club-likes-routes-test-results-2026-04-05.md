\## Arquivo testado



`backend/tests/club-likes.routes.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Criação de like quando o usuário ainda não curtiu o club prompt



2\. Remoção de like quando o club prompt já estiver curtido



\## Resultado da execução



PASS  tests/club-likes.routes.test.ts



&#x20; POST /clubs/:id/like

&#x20;   √ deve criar like quando o usuário ainda não curtiu o club prompt (531 ms)

&#x20;   √ deve remover like quando já estiver curtido (186 ms)



Test Suites: 1 passed, 1 total

Tests:       2 passed, 2 total

Snapshots:   0 total

Time:        3.501 s

Ran all test suites within paths "tests/club-likes.routes.test.ts".



\## Interpretação



Os testes automatizados confirmam que a rota de likes para club prompts está funcionando corretamente, garantindo o comportamento de alternância entre curtir e remover curtida.



Os testes garantem que:



\- o sistema cria um like quando o usuário ainda não curtiu o club prompt



\- o sistema remove o like quando o usuário já havia curtido anteriormente



\## Conclusão



A suíte `club-likes.routes.test.ts` valida com sucesso a funcionalidade de likes em club prompts, garantindo consistência no comportamento de toggle e persistência correta das interações.

