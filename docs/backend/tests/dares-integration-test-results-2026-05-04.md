## Arquivo testado

`backend/tests/dares.integration.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL

## Cenários validados

1. Criação de dare via API com `targetUserId` e exibição correspondente no feed

2. Manutenção do contrato atual do feed ao criar novos dares dinamicamente com `targetUserId`

3. Criação de dare com `maxAttempts` e `expiresAt` customizados e reflexo desses dados no feed

## Resultado da execução

PASS  tests/dares.integration.test.ts

  Dare → Feed integration
    √ deve refletir no feed um dare criado via API com targetUserId (691 ms)
    √ deve manter o contrato atual do feed ao criar novos dares dinamicamente com targetUserId (346 ms)
    √ deve refletir no feed um dare com maxAttempts e expiresAt customizados (186 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        2.599 s, estimated 5 s
Ran all test suites within paths "tests/dares.integration.test.ts".

## Interpretação

Os testes automatizados confirmam que a integração entre a criação de desafios do tipo dare e o feed está funcionando corretamente.

Os testes garantem que:

- um dare criado via API aparece no feed com o `id` correspondente

- o feed mantém o contrato atual esperado para itens do tipo dare

- dares criados com configurações customizadas, como `maxAttempts` e `expiresAt`, preservam essas informações no retorno do feed

- a busca do item no feed ocorre pelo `id` retornado na criação, evitando falsos positivos com outros dares existentes

## Conclusão

A suíte `dares.integration.test.ts` valida com sucesso a integração entre criação de dares e exibição no feed, confirmando que o contrato atual permanece consistente após os ajustes feitos para suportar o fluxo de envio de provas.
