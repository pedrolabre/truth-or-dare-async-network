\## Arquivo testado



`backend/tests/dares.service.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Criação de dare real persistido no banco



2\. Remoção de espaços nas extremidades do conteúdo antes de persistir



3\. Falha na criação quando o `authorId` não for informado



4\. Falha na criação quando o conteúdo não for informado



\## Resultado da execução



PASS  tests/dares.service.test.ts



&#x20; createDare

&#x20;   √ deve criar um dare real persistido no banco (541 ms)

&#x20;   √ deve remover espaços nas extremidades do conteúdo antes de persistir (100 ms)

&#x20;   √ deve falhar quando o authorId não for informado (30 ms)

&#x20;   √ deve falhar quando o conteúdo não for informado (88 ms)



Test Suites: 1 passed, 1 total

Tests:       4 passed, 4 total

Snapshots:   0 total

Time:        2.194 s

Ran all test suites within paths "tests/dares.service.test.ts".



\## Interpretação



Os testes automatizados confirmam que o service de dares está funcionando corretamente na operação de criação, com persistência real no banco de dados e validação das regras essenciais de entrada.



Os testes garantem que:



\- a criação de dares válidos ocorre com persistência real no banco de dados



\- o conteúdo é normalizado antes da persistência, removendo espaços desnecessários nas extremidades



\- a ausência de `authorId` impede a criação do dare



\- a ausência de conteúdo impede a criação do dare



\## Conclusão



A suíte `dares.service.test.ts` valida com sucesso a lógica de criação de dares na camada de service, garantindo persistência correta dos dados, normalização de conteúdo e validação adequada das entradas obrigatórias.

