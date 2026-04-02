\# Resultados dos testes automatizados do serviço de usuários



\## Arquivo testado



`backend/tests/users.service.test.ts`



\## Ferramentas utilizadas



\- Jest

\- Prisma

\- PostgreSQL



\## Cenários validados



1\. Listagem de usuários reais excluindo o usuário autenticado

2\. Filtragem de usuários pela query informada

3\. Falha quando o identificador do usuário autenticado não é informado



\## Resultado da execução



```text

PASS  tests/users.service.test.ts

&#x20; users.service

&#x20;   √ deve listar usuários exceto o usuário autenticado (649 ms)

&#x20;   √ deve filtrar usuários pela query (246 ms)

&#x20;   √ deve lançar erro quando currentUserId não for informado (23 ms)



Test Suites: 1 passed, 1 total

Tests:       3 passed, 3 total

Snapshots:   0 total

Time:        5.022 s

Ran all test suites matching /users.service.test.ts/i.

```



\## Interpretação



Os testes automatizados confirmam que a camada de serviço responsável pela listagem de usuários para a tela de criação de challenge está funcionando corretamente, garantindo:



\- leitura de dados reais persistidos no banco PostgreSQL via Prisma

\- exclusão do próprio usuário autenticado da lista retornada

\- aplicação correta da filtragem por query

\- validação da regra mínima de entrada obrigatória para identificação do usuário autenticado



Os testes garantem que:



\- usuários elegíveis são retornados corretamente quando existem no banco

\- o usuário autenticado não aparece na lista de seleção

\- a busca por nome funciona corretamente com dados reais persistidos

\- entradas inválidas são rejeitadas com erro apropriado

\- a base de suporte ao picker de usuários está consistente na camada de serviço



\## Conclusão



A suíte `users.service.test.ts` valida com sucesso a lógica de negócio da listagem de usuários para seleção na criação de truths e dares, garantindo consistência das regras, filtragem correta e acesso confiável aos dados reais persistidos no banco de dados.

