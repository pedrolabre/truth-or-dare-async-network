## Arquivo testado

`backend/tests/feed.routes.test.ts`

## Escopo do relatorio

Validacao da rota autenticada `GET /feed`, cobrindo autenticacao, retorno de feed persistido, compatibilidade com o contrato mobile e regressao da inclusao de itens de clube projetados.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
> backend@1.0.0 test
> jest --runInBand tests/feed.routes.test.ts

[dotenv@17.3.1] injecting env (4) from .env.test
Resetando banco de testes...
Datasource "db": PostgreSQL database "truth_or_dare_test", schema "public" at "localhost:5432"

Applying migration `20260328161030_init`
Applying migration `20260331155538_create_feed_domain_models`
Applying migration `20260404141910_add_target_user_to_truths_and_dares`
Applying migration `20260405031052_add_dare_progress_fields`
Applying migration `20260405134121_add_likes`
Applying migration `20260408191756_add_username_and_bio_to_user`
Applying migration `20260504162510_add_dare_proofs`
Applying migration `20260506134926_add_truth_comments`
Applying migration `20260508150924_add_truth_reports`
Applying migration `20260509004417_add_club_foundation`
Applying migration `20260511140000_add_club_prompt_response_like_types`

Database reset successful
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
PASS tests/feed.routes.test.ts (9.945 s)
  GET /feed
    √ deve retornar 401 quando o token não for informado (812 ms)
    √ deve retornar 401 quando o token estiver mal formatado (39 ms)
    √ deve retornar 401 quando o token for inválido (39 ms)
    √ deve retornar o feed real persistido no banco para usuário autenticado (1016 ms)
    √ deve manter o contrato compatível com o mobile (724 ms)
    √ deve retornar feed vazio quando não houver dados persistidos (872 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        10.183 s
Ran all test suites matching /tests\\feed.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 1.10s
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 sem token.
- Retorno 401 com token mal formatado.
- Retorno 401 com token invalido.
- Retorno 200 para usuario autenticado.
- Leitura de truths persistidas.
- Leitura de dares persistidos.
- Leitura de itens de clube projetados.
- Separacao dos tipos `truth`, `dare` e `club`.
- Contrato de truth compativel com o mobile.
- Contrato de dare compativel com o mobile.
- Contrato de clube compativel com o mobile.
- Retorno de `answersCount` em item de clube.
- Feed vazio quando nao ha dados persistidos.

## Interpretacao

A rota `GET /feed` permanece a superficie global consumida pelo mobile. A suite garante que a autenticacao continua protegendo o endpoint e que a resposta segue aceitando os tres tipos de item esperados pelo cliente atual.

Para atividades de clube, a validacao confirma apenas o contrato publico do feed geral. Detalhes internos, respostas, comentarios e moderacao continuam fora dessa rota e sao cobertos pelas superficies de clube. Essa separacao reduz o risco de o feed geral virar dono de regras do dominio de clubes.

O teste de feed vazio protege o comportamento base quando nao ha dados persistidos, evitando regressao para respostas nulas, erros 500 ou mocks acoplados.

## Conclusao

A suite `feed.routes.test.ts` passou com sucesso e valida a rota geral de feed com itens de clube projetados no contrato atual.
