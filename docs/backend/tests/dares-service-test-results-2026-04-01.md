\# Resultados dos testes automatizados do serviço de dares



\## Arquivo testado



`backend/tests/dares.service.test.ts`



\## Ferramentas utilizadas



\- Jest



\- Prisma



\- PostgreSQL



\## Cenários validados



1\. Criação de dare persistido no banco



2\. Normalização do conteúdo (remoção de espaços)



3\. Falha quando o authorId não é informado



4\. Falha quando o conteúdo é inválido



\## Resultado da execução



```text

PASS  tests/dares.service.test.ts

&#x20; createDare

&#x20;   √ deve criar um dare real persistido no banco (550 ms)

&#x20;   √ deve remover espaços nas extremidades do conteúdo antes de persistir (112 ms)

&#x20;   √ deve falhar quando o authorId não for informado (36 ms)

&#x20;   √ deve falhar quando o conteúdo não for informado (90 ms)



Test Suites: 1 passed, 1 total

Tests:       4 passed, 4 total

Snapshots:   0 total

Time:        4.641 s

Ran all test suites within paths "tests/dares.service.test.ts".

```



\## Interpretação



Os testes automatizados confirmam que a camada de serviço responsável pela criação de dares está funcionando corretamente, garantindo:



\- persistência real dos dados no banco PostgreSQL via Prisma



\- aplicação de valores padrão de domínio (`maxAttempts` e `expiresAt`)



\- normalização adequada do conteúdo antes da gravação



\- validação das regras de negócio essenciais



Os testes garantem que:



\- dares são criados corretamente com dados válidos



\- o conteúdo é tratado antes da persistência, evitando inconsistências



\- valores padrão são aplicados corretamente na criação



\- entradas inválidas são rejeitadas com erros apropriados



\- não há inserção de dados inválidos no banco



\## Conclusão



A suíte `dares.service.test.ts` valida com sucesso a lógica de negócio da criação de dares, garantindo integridade dos dados, consistência das validações e correta persistência no banco de dados.

