## Arquivo testado

`backend/tests/clubs.permissions.test.ts`

## Ferramentas utilizadas

- Jest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenarios validados

1. Calculo de permissoes para membro ativo com papel `owner`
2. Calculo de permissoes para membro ativo com papel `admin`
3. Calculo de permissoes para membro ativo com papel `moderator`
4. Calculo de permissoes para membro ativo com papel `member`
5. `owner` ativo recebe `podeEditar`, `podeConvidar`, `podeModerar`, `podePostar` e `podeResponder`
6. `admin` ativo recebe `podeEditar`, `podeConvidar`, `podeModerar`, `podePostar` e `podeResponder`
7. `moderator` ativo nao recebe `podeEditar` nem `podeConvidar`, mas recebe `podeModerar`, `podePostar` e `podeResponder`
8. `member` ativo recebe apenas `podePostar` e `podeResponder`
9. Bloqueio de permissoes internas para status `invited`
10. Bloqueio de permissoes internas para status `requested`
11. Bloqueio de permissoes internas para status `removed`
12. Bloqueio de permissoes internas para outsider
13. Bloqueio de permissoes internas em clube arquivado

## Resultado da execucao

PASS  tests/clubs.permissions.test.ts

```text
clubs.permissions
  passou calcula permissoes para membro ativo owner
  passou calcula permissoes para membro ativo admin
  passou calcula permissoes para membro ativo moderator
  passou calcula permissoes para membro ativo member
  passou nega permissoes internas para status invited
  passou nega permissoes internas para status requested
  passou nega permissoes internas para status removed
  passou nega permissoes internas para outsider e clube arquivado

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
```

## Validacao adicional

O build do backend tambem foi executado apos a criacao do helper:

```text
npm run build
Build TypeScript/Prisma: passou
```

## Interpretacao

Os testes confirmam que `getClubPermissions(userId, clubId)` calcula as flags internas da Etapa 3 sem depender do DTO antigo de detalhe de clube.

As regras validadas sao:

- `owner` e `admin` ativos podem editar, convidar, moderar, postar e responder
- `moderator` ativo pode moderar, postar e responder
- `member` ativo pode postar e responder
- usuarios `invited`, `requested`, `removed` e outsiders nao recebem permissoes internas
- clubes arquivados nao concedem permissoes internas

Observacao: a lista de cenarios e maior que o numero de testes porque alguns `it.each` cobrem multiplos papeis/status dentro do mesmo bloco de teste.

## Conclusao

A suite valida com sucesso o helper de permissoes que servira de base para membros, convites, solicitacoes, moderacao e feed interno nas proximas fatias da Etapa 3.
