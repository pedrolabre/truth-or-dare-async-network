## Arquivos testados

```text
backend/src/controllers/uploads/uploads.controller.ts
backend/src/routes/uploads/uploads.routes.ts
backend/src/services/uploads/uploads.service.ts
backend/src/services/uploads/upload-validators.ts
backend/src/services/uploads/upload-permissions.ts
backend/src/services/uploads/upload-paths.ts
backend/tests/uploads.routes.test.ts
```

## Escopo do relatorio

Validacao backend dos contratos de upload assinado em `POST /uploads/sign`,
cobrindo autenticacao, validacao de payload, alias retrocompativel,
permissoes por entidade, montagem de paths por dominio, chamada ao Supabase
Storage por mock, tratamento seguro de erro de configuracao e retorno HTTP
esperado.

Data da execucao: 06/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- Supertest
- ts-jest
- Prisma
- PostgreSQL
- dotenv
- TypeScript

## Resultado da execucao

Comando executado em `backend/`:

```text
npm test -- --runInBand tests/uploads.routes.test.ts
```

Resultado:

```text
PASS tests/uploads.routes.test.ts
  POST /uploads/sign
    [ok] retorna 401 quando o token nao e informado
    [ok] assina avatar do proprio usuario em profile-avatars/{userId}
    [ok] mantem group-avatar como alias retrocompativel de club-avatar
    [ok] assina capa de clube apenas para quem pode editar o clube
    [ok] retorna 403 quando membro comum tenta assinar avatar de clube
    [ok] retorna 404 quando a entidade relacionada nao existe
    [ok] mantem dare-proof restrito ao usuario desafiado
    [ok] assina anexos de comentario para truth existente
    [ok] assina usos futuros de anexos de prompt e resposta de clube com permissao de postagem
    [ok] retorna 400 para usage, MIME, tamanho e nome de arquivo invalidos
    [ok] retorna erro seguro quando a configuracao do Supabase esta ausente

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        12.889 s
Ran all test suites matching /tests\\uploads.routes.test.ts/i.
```

Observacao: a suite resetou o banco de testes e aplicou as migrations antes da
execucao. O Supabase Storage foi mockado no teste, portanto nenhum bucket real
foi criado, nenhuma rede externa foi chamada e nenhum arquivo real foi enviado.

## Validacoes adicionais

Validacao TypeScript:

```text
npx tsc --noEmit
```

Resultado:

```text
Comando concluido com exit code 0.
Sem erros de TypeScript.
```

Validacao do schema Prisma:

```text
npx prisma validate
```

Resultado:

```text
The schema at prisma\schema.prisma is valid.
```

Build backend:

```text
npm run build
```

Resultado:

```text
> prisma generate && tsc -p tsconfig.build.json

Generated Prisma Client (7.6.0) to .\src\generated\prisma
Comando concluido sem erros.
```

## Cenarios validados

- `POST /uploads/sign` rejeita requisicao sem token com `401`.
- `profile-avatar` assina upload para o proprio usuario autenticado.
- `profile-avatar` gera path em `profile-avatars/{userId}/...`.
- `profile-avatar` aceita MIME de imagem permitido.
- `profile-avatar` aceita `sizeBytes` opcional dentro do limite de 5 MB.
- `group-avatar` permanece aceito como alias retrocompativel.
- `group-avatar` gera path canonico em `club-avatars/{clubId}/...`.
- `club-avatar` exige `entityId` de clube.
- `club-avatar` rejeita membro comum sem permissao de edicao com `403`.
- `club-cover` aceita owner/admin com permissao `canEditClub`.
- `club-cover` gera path em `club-covers/{clubId}/...`.
- `club-cover` aceita limite defensivo de ate 10 MB.
- Entidade de clube inexistente retorna `404`.
- `dare-proof` rejeita usuario que nao e o alvo do desafio com `403`.
- `dare-proof` aceita o usuario desafiado.
- `dare-proof` gera path em `dare-proofs/{userId}/{dareId}/...`.
- `dare-proof` aceita video dentro do limite defensivo de 100 MB.
- `comment-attachment` aceita anexo para truth existente.
- `comment-attachment` gera path em `comment-attachments/{userId}/{entityId}/...`.
- `club-prompt-attachment` aceita membro ativo com permissao de postagem no clube.
- `club-prompt-attachment` gera path em `club-prompt-attachments/{userId}/{clubId}/...`.
- `club-response-attachment` aceita membro ativo com permissao de responder ao prompt.
- `club-response-attachment` gera path em `club-response-attachments/{userId}/{promptId}/...`.
- Uso desconhecido retorna `400`.
- MIME nao permitido para o uso retorna `400`.
- Tamanho acima do limite defensivo retorna `400`.
- Nome de arquivo com tentativa de path traversal retorna `400`.
- Requisicoes invalidas nao chamam o client admin do Supabase.
- Falta de configuracao do Supabase retorna `500` com mensagem acionavel.
- Erro seguro de configuracao nao repete marcador sensivel nem URL assinada.
- Assinatura valida chama `createSignedUploadUrl` com `upsert: false`.
- Quando `SUPABASE_STORAGE_PUBLIC=true`, a resposta inclui `publicUrl` derivada do path.

## Interpretacao

A execucao confirma que a rota `POST /uploads/sign` permanece como contrato
unico de assinatura de upload para o mobile e que a validacao acontece antes da
chamada ao Supabase Storage.

Os testes cobrem a separacao entre validacao, permissao e montagem de path:
payloads invalidos param com `400`, ausencia de autenticacao para no middleware
com `401`, falta de permissao retorna `403` e entidade inexistente retorna
`404`.

O alias `group-avatar` foi preservado para compatibilidade, mas o path final ja
usa o dominio canonico `club-avatars/{clubId}/...`. O novo uso `club-cover`
tambem foi validado com permissao de edicao de clube.

As permissoes de dominio foram exercitadas com usuarios reais no banco de teste:
owner/admin de clube, membro comum, usuario alvo de dare, usuario sem permissao
e membro ativo em prompt de clube.

O teste de erro de configuracao comprova que uma falha ao criar o client admin
do Supabase e convertida para mensagem operacional segura, sem expor marcador
sensivel nem URL assinada.

## Conclusao

A suite dedicada passou com 11 testes. A validacao TypeScript, o schema Prisma
e o build backend tambem foram executados com sucesso.

O contrato backend de upload assinado esta validado para avatar de usuario,
avatar de clube, capa de clube, prova de desafio, anexo de comentario e usos
futuros de anexos de prompt/resposta de clube, sem depender de bucket real ou
deploy externo.
