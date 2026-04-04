\# Resultados dos testes de integração entre criação de truths e feed



\## Arquivo testado



`backend/tests/truths.integration.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Supertest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Criação de truth via API com `targetUserId` refletida no feed



2\. Manutenção do contrato do feed após criação dinâmica de truths com `targetUserId`



\## Resultado da execução



```text

PASS  tests/truths.integration.test.ts

&#x20; Truth → Feed integration

&#x20;   √ deve refletir no feed uma truth criada via API com targetUserId (661 ms)

&#x20;   √ deve manter o contrato do feed ao criar novas truths dinamicamente com targetUserId (282 ms)



Test Suites: 1 passed, 1 total

Tests:       2 passed, 2 total

Snapshots:   0 total

Time:        4.01 s, estimated 5 s

Ran all test suites within paths "tests/truths.integration.test.ts".

```



\## Interpretação



Os testes de integração confirmam que o fluxo completo de criação de truths está funcionando corretamente, conectando todas as camadas do sistema:



\- rota HTTP (`POST /truths`)



\- controller



\- service



\- persistência no banco PostgreSQL



\- leitura via feed (`GET /feed`)



Os testes garantem que:



\- uma truth criada via API com usuário-alvo definido é imediatamente refletida no feed



\- o feed continua retornando dados reais persistidos



\- o contrato de resposta do feed permanece compatível com o mobile mesmo após inserções dinâmicas



\- não há quebra de integração entre escrita (create) e leitura (feed)



\- a persistência de `targetUserId` não compromete o comportamento esperado do feed



\## Conclusão



A suíte `truths.integration.test.ts` valida com sucesso a integração entre criação de conteúdo e consumo no feed, garantindo consistência entre as operações de escrita e leitura e assegurando que o backend suporta corretamente a persistência do usuário-alvo no fluxo real do produto.

