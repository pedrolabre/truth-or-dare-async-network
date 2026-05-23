## Arquivo testado

`backend/tests/club-reports.routes.test.ts`

## Escopo do relatorio

Validacao das rotas backend de denuncias de clubes, prompts, respostas e comentarios de prompt de clube, incluindo autenticacao, acesso legitimo, alvo inexistente, alvo em outro clube, payload invalido, duplicidade e auditoria.

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
PASS tests/club-reports.routes.test.ts (9.293 s)
  club reports routes
    [ok] retorna 401 sem token (421 ms)
    [ok] permite denunciar clube acessivel e registra audit log (626 ms)
    [ok] permite denunciar prompt resposta e comentario do clube (502 ms)
    [ok] retorna 404 para alvo inexistente ou pertencente a outro clube (483 ms)
    [ok] bloqueia denuncia sem acesso legitimo ou membership ativa quando conteudo privado exigir acesso (721 ms)
    [ok] retorna 400 para denuncia invalida e 409 para duplicidade (379 ms)
    [ok] bloqueia denuncia do proprio conteudo e de prompt indisponivel (360 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        9.464 s
Ran all test suites matching /tests\\club-reports.routes.test.ts/i.
```

## Validacoes adicionais

```text
npx prisma validate
npx tsc --noEmit
npm test -- --runInBand tests/clubs.routes.test.ts tests/club-prompts.routes.test.ts tests/club-prompt-responses.routes.test.ts tests/club-prompt-comments.routes.test.ts tests/clubs.members-actions-audit.routes.test.ts
```

Resultados:

- Prisma schema validado com sucesso.
- TypeScript backend validado com sucesso.
- Regressao backend de clubes, prompts, respostas, comentarios e auditoria aprovada: 5 suites, 31 testes passando.

## Cenarios validados

- Rejeicao de denuncia sem token.
- Denuncia de clube acessivel com persistencia e audit log.
- Denuncia de prompt de clube.
- Denuncia de resposta de prompt de clube.
- Denuncia de comentario de prompt de clube.
- Retorno 404 para alvo inexistente ou pertencente a outro clube.
- Bloqueio de denuncia sem acesso legitimo a clube privado.
- Bloqueio de membro removido ao denunciar conteudo privado.
- Retorno 400 para motivo invalido ou detalhes acima do limite.
- Retorno 409 para denuncia duplicada pelo mesmo usuario no mesmo alvo.
- Bloqueio de denuncia do proprio conteudo.
- Bloqueio de denuncia de prompt indisponivel.

## Interpretacao

As rotas de denuncias respeitam os contratos de autenticacao e permissao existentes em Clubes, usam persistencia dedicada de reports e registram `ClubAuditLog` sem armazenar detalhes textuais da denuncia na auditoria.

## Conclusao

As rotas backend de denuncias de clube, prompt, resposta e comentario foram validadas com sucesso, incluindo persistencia, auditoria, validacao de payload, duplicidade e regras de acesso.
