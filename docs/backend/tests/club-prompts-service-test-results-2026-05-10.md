## Arquivo testado

`backend/tests/club-prompts.service.test.ts`

## Escopo do relatorio

Validacao do servico responsavel pela criacao de prompts de verdade e desafio em clubes, incluindo persistencia, validacoes, permissoes, contadores e auditoria.

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

```text
PASS tests/club-prompts.service.test.ts (17.779 s)
  club-prompts.service
    √ cria prompt de verdade por membro ativo e atualiza contadores do clube (3345 ms)
    √ cria prompt de desafio com tentativas, prazo, dificuldade e anexos (750 ms)
    √ registra audit log de criacao de prompt (431 ms)
    √ bloqueia outsider e membro sem status ativo (530 ms)
    √ bloqueia criacao em clube arquivado (138 ms)
    √ valida tipo, conteudo, prazo e anexos invalidos (223 ms)
    √ permite fixar prompt apenas por owner, admin ou moderator (314 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        18.718 s
Ran all test suites matching /tests\\club-prompts.service.test.ts/i.

Build TypeScript/Prisma: passou
```

## Validacao adicional

A suite foi executada em modo sequencial com `--runInBand`, usando reset do banco de testes antes da execucao. A compilacao completa do backend tambem foi executada para validar tipos e integracao com o Prisma Client gerado.

## Cenarios validados

- Criacao de prompt de verdade por membro ativo.
- Atualizacao de `promptCount` e `lastActivityAt` do clube.
- Criacao de prompt de desafio com tentativas, prazo, dificuldade e anexos.
- Registro de audit log para criacao de prompt.
- Bloqueio de usuario fora do clube.
- Bloqueio de membro sem status ativo.
- Bloqueio de criacao em clube arquivado.
- Validacao de tipo, conteudo, prazo e anexos invalidos.
- Permissao para fixar prompt restrita a owner, admin ou moderator.

## Interpretacao

O servico cria prompts de clube com os campos esperados, aplica as regras de permissao e validacao antes da persistencia e mantem os metadados do clube sincronizados. Os cenarios negativos confirmam que usuarios sem permissao ou clubes inativos nao conseguem publicar prompts.

## Conclusao

A criacao de prompts de verdade e desafio em clubes esta validada no nivel de servico, com cobertura para fluxo principal, erros de validacao, autorizacao, contadores e auditoria.
