\# Resultados dos testes automatizados do serviço de feed



\## Arquivo testado

`backend/tests/feed.service.test.ts`



\## Ferramentas utilizadas

\- Jest

\- Prisma

\- PostgreSQL



\## Cenários validados

1\. Retorno de itens reais persistidos no banco para `truth`, `dare` e `club`

2\. Retorno de feed vazio quando não houver dados persistidos

3\. Compatibilidade do contrato do feed com o mobile

4\. Geração correta de labels derivadas para `dare`, incluindo tentativas e expiração



\## Resultado da execução

```text

PASS  tests/feed.service.test.ts

&#x20; getFeed

&#x20;   √ deve retornar itens reais persistidos no banco para truth, dare e club (795 ms)

&#x20;   √ deve retornar feed vazio quando não houver dados persistidos (87 ms)

&#x20;   √ deve preencher o contrato esperado pelo mobile para cada tipo de item (301 ms)

&#x20;   √ deve retornar labels coerentes para dare com expiração e tentativas (291 ms)



Test Suites: 1 passed, 1 total

Tests:       4 passed, 4 total

Snapshots:   0 total

Time:        4.044 s

Ran all test suites matching /tests\\\\feed.service.test.ts/i.

```



\## Interpretação

Os testes automatizados confirmam que o serviço responsável pela montagem do feed está funcionando corretamente com dados reais persistidos no banco:

\- o sistema agrega corretamente conteúdos dos tipos `truth`, `dare` e `club`

\- o feed responde corretamente mesmo quando não há dados disponíveis

\- o contrato retornado permanece consistente com o esperado pelo mobile

\- campos derivados específicos de `dare`, como tentativas e tempo restante, são calculados corretamente



A validação foi feita utilizando Prisma com PostgreSQL, garantindo que o comportamento testado corresponde ao ambiente real da aplicação.



\## Conclusão

A suíte `feed.service.test.ts` valida com sucesso a lógica central de composição do feed, assegurando consistência dos dados, integridade do contrato com o mobile e correto processamento de informações derivadas.

