## Arquivo testado

`backend/tests/proofs.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL

## Cenários validados

1. Rejeição do envio de prova quando o token não é informado

2. Criação de uma proof real no banco quando o usuário alvo envia a prova

3. Aceitação de proof com mídia do tipo `audio` e texto opcional vazio

4. Bloqueio do envio de proof por usuário que não é o alvo do dare

5. Validação de erro quando `mediaType` é inválido

6. Validação de erro quando `fileUrl` não é informado

7. Bloqueio do envio de proof quando o dare já está concluído

8. Bloqueio do envio de proof quando o dare está expirado

9. Bloqueio do envio de proof quando o dare está sem tentativas disponíveis

## Resultado da execução

PASS  tests/proofs.routes.test.ts

  POST /dares/:id/proof
    √ deve retornar 401 quando o token não for informado (359 ms)
    √ deve criar uma proof real no banco quando o usuário alvo envia a prova (311 ms)
    √ deve aceitar proof com audio e texto opcional vazio (198 ms)
    √ deve retornar 403 quando outro usuário tenta enviar proof para dare que não é dele (304 ms)
    √ deve retornar 400 quando mediaType for inválido (172 ms)
    √ deve retornar 400 quando fileUrl não for informado (169 ms)
    √ deve retornar 403 quando o dare já estiver concluído (198 ms)
    √ deve retornar 403 quando o dare estiver expirado (195 ms)
    √ deve retornar 403 quando o dare estiver sem tentativas disponíveis (231 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        4.06 s
Ran all test suites within paths "tests/proofs.routes.test.ts".

## Interpretação

Os testes automatizados confirmam que a rota `POST /dares/:id/proof` está funcionando corretamente para o fluxo de envio de prova de desafios do tipo dare.

Os testes garantem que:

- o endpoint exige autenticação via token

- o sistema permite que apenas o usuário alvo do dare envie a prova

- a prova é persistida corretamente no banco como `DareProof`

- a proof fica associada ao dare e ao usuário responsável pelo envio

- o dare é marcado como concluído após o envio de prova válido

- o sistema aceita os tipos de mídia previstos para o MVP: `video`, `audio` e `file`

- o sistema valida corretamente `mediaType`, `fileUrl`, `durationSeconds` e texto opcional

- o sistema bloqueia envio de prova em dares concluídos, expirados ou sem tentativas disponíveis

## Conclusão

A suíte `proofs.routes.test.ts` valida com sucesso o backend de envio de prova para dares, garantindo autenticação, validações de entrada, controle de autorização, persistência real no banco e atualização do status do desafio após o envio da proof.
