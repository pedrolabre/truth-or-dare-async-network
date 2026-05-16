## Arquivo testado

`backend/tests/feed.routes.test.ts`

## Escopo do relatorio

Validacao de regressao do endpoint autenticado de feed geral apos a separacao da projecao de prompts de clube, incluindo autenticacao, status codes, resposta com dados reais, contrato mobile e retorno vazio.

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
PASS tests/feed.routes.test.ts (5.908 s)
  GET /feed
    √ deve retornar 401 quando o token não for informado (397 ms)
    √ deve retornar 401 quando o token estiver mal formatado (19 ms)
    √ deve retornar 401 quando o token for inválido (16 ms)
    √ deve retornar o feed real persistido no banco para usuário autenticado (673 ms)
    √ deve manter o contrato compatível com o mobile (514 ms)
    √ deve retornar feed vazio quando não houver dados persistidos (445 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        6.116 s, estimated 9 s
Ran all test suites matching /tests\\feed.routes.test.ts/i.
```

## Validacao adicional

```text
> backend@1.0.0 build
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma in 890ms

Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
```

## Cenarios validados

- Retorno 401 para requisicao sem token.
- Retorno de erro `Token nao informado` quando o header de autorizacao esta ausente.
- Retorno 401 para token mal formatado.
- Retorno de erro `Token mal formatado` quando o esquema do header e invalido.
- Retorno 401 para token invalido.
- Retorno de erro `Token invalido ou expirado` para bearer invalido.
- Retorno 200 para usuario autenticado.
- Retorno de array com 7 itens no cenario base.
- Retorno de 2 itens de truth.
- Retorno de 2 itens de dare.
- Retorno de 3 itens de club.
- Preservacao de truth conhecida pelo conteudo esperado.
- Preservacao de dare conhecido por autor e conteudo esperados.
- Preservacao de item de clube conhecido por `clubName`, `badge` e `quote`.
- Preservacao do contrato mobile para item truth.
- Preservacao do contrato mobile para item dare.
- Validacao de `progress` entre 0 e 1 em dare.
- Preservacao do contrato mobile para item club.
- Retorno 200 com lista vazia quando nao ha dados persistidos no feed.
- Validacao da serializacao HTTP do feed geral.
- Validacao do middleware de autenticacao antes da chamada ao servico.
- Validacao sem alteracao de schema Prisma.

## Interpretacao

A suite demonstra que o endpoint `GET /feed` continua protegido por autenticacao e preserva os erros esperados para ausencia de token, token mal formatado e token invalido. Isso confirma que a mudanca na projecao de clubes nao alterou a camada HTTP de autorizacao do feed geral.

Para usuario autenticado, a rota continua retornando o feed geral no formato consumido pelo mobile. Os testes confirmam a presenca de truths, dares e itens de clube no cenario base, validam conteudos conhecidos e preservam o contrato publico dos tres tipos de item depois da separacao da logica de projecao.

Os testes de rota complementam os testes de servico porque exercitam serializacao JSON, status codes, middleware e corpo da resposta. A presenca dos itens `club` na resposta autenticada confirma que a projecao de prompts de clube permanece integrada ao feed geral sem transformar a rota em uma superficie de dominio de clubes.

Como a suite foi executada com banco resetado e build TypeScript concluido, o endpoint foi validado contra Prisma, PostgreSQL, Supertest e o contrato de tipos atual sem necessidade de alteracao de schema.

## Conclusao

A suite `feed.routes.test.ts` valida com sucesso a regressao do endpoint autenticado de feed geral apos a separacao da projecao de clubes, com contrato mobile preservado e build TypeScript concluido sem erros.
