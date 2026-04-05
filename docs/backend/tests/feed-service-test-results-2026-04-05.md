\## Arquivo testado



`backend/tests/feed.service.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Retorno de itens reais persistidos no banco para truth, dare e club



2\. Retorno de feed vazio quando não houver dados persistidos



3\. Preenchimento correto do contrato esperado pelo mobile para cada tipo de item



4\. Geração de labels coerentes para dare com expiração e tentativas



\## Resultado da execução



PASS  tests/feed.service.test.ts



&#x20; getFeed

&#x20;   √ deve retornar itens reais persistidos no banco para truth, dare e club (879 ms)

&#x20;   √ deve retornar feed vazio quando não houver dados persistidos (106 ms)

&#x20;   √ deve preencher o contrato esperado pelo mobile para cada tipo de item (333 ms)

&#x20;   √ deve retornar labels coerentes para dare com expiração e tentativas (321 ms)



Test Suites: 1 passed, 1 total

Tests:       4 passed, 4 total

Snapshots:   0 total

Time:        2.491 s, estimated 4 s

Ran all test suites within paths "tests/feed.service.test.ts".



\## Interpretação



Os testes automatizados confirmam que o service responsável pela construção do feed está funcionando corretamente, integrando dados reais do banco e garantindo compatibilidade com o contrato esperado pelo mobile.



Os testes garantem que:



\- o feed retorna corretamente itens persistidos de diferentes tipos (truth, dare e club)



\- o sistema lida corretamente com cenários sem dados, retornando um feed vazio



\- o formato dos dados retornados está compatível com o contrato consumido pelo frontend mobile



\- os dares possuem labels coerentes baseados em regras de expiração e número de tentativas



\## Conclusão



A suíte `feed.service.test.ts` valida com sucesso a lógica de agregação e formatação do feed, garantindo integridade dos dados retornados, compatibilidade com o mobile e correta aplicação das regras de negócio para exibição dos desafios.

