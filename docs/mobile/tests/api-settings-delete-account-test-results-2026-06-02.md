## Arquivos testados

```text
mobile/services/api.ts
mobile/types/settings.ts
mobile/__tests__/api.settings.test.ts
```

## Escopo do relatorio

Validacao do client mobile de Configuracoes para exclusao de conta via
`DELETE /users/me`, garantindo envio autenticado da senha atual sem regredir os
clientes ja existentes de conta, e-mail, senha e suporte.

Data da execucao: 02/06/2026.

## Ferramentas utilizadas

- PowerShell
- npm
- Jest
- jest-expo
- Mock de `fetch`
- Mock de `AsyncStorage`

## Comandos executados

Comando executado em `mobile/`:

```bash
npm test -- --runInBand __tests__/api.settings.test.ts
```

## Resultado da execucao

```text
PASS __tests__/api.settings.test.ts (5.065 s)
  settings API client
    [ok] busca a conta autenticada com token salvo
    [ok] atualiza parcialmente a conta autenticada sem completar o payload
    [ok] altera o e-mail enviando senha atual e token salvo
    [ok] altera a senha enviando credenciais e token salvo
    [ok] envia denuncia de abuso com token salvo
    [ok] exclui conta com senha atual e DELETE autenticado
    [ok] bloqueia getMe quando nao existe token salvo
    [ok] bloqueia updateMe quando nao existe token salvo
    [ok] bloqueia changeEmail quando nao existe token salvo
    [ok] bloqueia changePassword quando nao existe token salvo
    [ok] bloqueia reportAbuse quando nao existe token salvo
    [ok] bloqueia deleteAccount quando nao existe token salvo
    [ok] reaproveita parseResponse para propagar erro da API
    [ok] preserva getMyProfile e updateMyProfile para consumidores existentes

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

Resultado: suite concluida com exit code 0.

## Cenarios validados

- `deleteAccount({ currentPassword })` chama `DELETE /users/me`.
- A chamada envia corpo JSON com a senha atual.
- A chamada preserva `Content-Type: application/json`.
- A chamada preserva `Authorization: Bearer <token>`.
- Sem token salvo, `deleteAccount()` rejeita antes de chamar `fetch`.
- O retorno `{ ok: true }` e repassado pelo `parseResponse`.
- Erros da API continuam sendo propagados por `parseResponse`.
- `getMe`, `updateMe`, `changeEmail`, `changePassword` e `reportAbuse`
  continuam usando o mesmo padrao autenticado.
- `getMyProfile` e `updateMyProfile` permanecem compativeis com consumidores
  existentes.

## Validacao manual

Nao houve execucao manual no Expo Go, simulador, navegador ou cliente mobile
real.

## Interpretacao

A execucao confirma que a exclusao de conta deixou de ser uma chamada sem
payload e passou a enviar a senha atual ao backend, mantendo o padrao de token e
tratamento de resposta usado pelos demais clientes de Configuracoes.

## Conclusao

A suite do client de API passou com 14 testes. O contrato mobile de exclusao de
conta esta tipado, autenticado e integrado ao tratamento de erro existente.
