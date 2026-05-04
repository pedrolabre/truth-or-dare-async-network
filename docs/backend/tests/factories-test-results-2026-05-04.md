## Arquivo testado

`backend/tests/factories.test.ts`

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL

## Cenários validados

1. Criação de um cenário completo e persistido no banco

2. Reset apenas dos dados do feed sem apagar usuários

3. Recriação do cenário com os mesmos usuários de teste e novos dados de feed

4. Remoção dos usuários quando a opção `deleteUsers` estiver habilitada

## Resultado da execução

PASS  tests/factories.test.ts

  test-utils/factories
    √ deve criar um cenário completo e persistido no banco (917 ms)
    √ deve permitir resetar apenas os dados do feed sem apagar usuários (309 ms)
    √ deve permitir recriar o cenário com os mesmos usuários de teste e novos dados de feed (591 ms)
    √ deve apagar também os usuários quando deleteUsers for true (387 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        3.002 s, estimated 4 s
Ran all test suites within paths "tests/factories.test.ts".

## Interpretação

Os testes automatizados confirmam que as factories e utilitários de teste continuam funcionando corretamente após as mudanças recentes no backend.

Os testes garantem que:

- o sistema consegue criar um cenário completo de dados persistidos no banco

- o reset pode limpar apenas os dados do feed sem remover usuários

- o cenário de teste pode ser recriado reaproveitando os mesmos usuários

- o reset também pode apagar usuários quando configurado com `deleteUsers`

## Conclusão

A suíte `factories.test.ts` valida com sucesso os utilitários de criação e reset de dados usados pelos testes automatizados do backend, garantindo uma base confiável para as demais suítes.
