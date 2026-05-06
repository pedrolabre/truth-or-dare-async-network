## Arquivo testado

`backend/tests/truth-comments.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli

## Cenários validados

1. Rejeição da listagem de comentários quando o token não é informado

2. Listagem vazia quando a truth ainda não possui comentários

3. Listagem de comentários reais com autor, replies, `likesCount` e `likedByMe`

4. Retorno de erro 404 quando a truth informada não existe

5. Criação de comentário raiz real para usuário autenticado

6. Criação de reply real associado a um comentário raiz

7. Validação de erro quando o texto do comentário está vazio

8. Bloqueio de resposta em segundo nível ao tentar responder uma reply

9. Validação de erro quando o comentário pai pertence a outra truth

10. Validação de erro ao tentar comentar em uma truth inexistente

11. Criação de like em comentário com retorno de `liked` e `likesCount`

12. Remoção de like em comentário ao chamar o endpoint novamente

13. Criação de like em reply usando o mesmo endpoint de comentários

## Resultado da execução

PASS  tests/truth-comments.routes.test.ts

  Truth comments routes
    GET /truths/:id/comments
      √ deve retornar 401 quando o token não for informado (282 ms)
      √ deve retornar lista vazia quando a truth ainda não tiver comentários (434 ms)
      √ deve retornar comentários reais com autor, replies, likesCount e likedByMe (333 ms)
      √ deve retornar 404 quando a truth não existir (243 ms)

    POST /truths/:id/comments
      √ deve criar comentário raiz real para usuário autenticado (271 ms)
      √ deve criar reply real associado a um comentário raiz (273 ms)
      √ deve retornar 400 quando o texto estiver vazio (245 ms)
      √ deve retornar 400 quando tentar responder uma resposta (246 ms)
      √ deve retornar 404 quando o comentário pai não pertencer à mesma truth (244 ms)
      √ deve retornar 404 quando a truth não existir (244 ms)

    POST /truths/comments/:id/like
      √ deve curtir comentário e retornar liked true com likesCount atualizado (238 ms)
      √ deve remover curtida ao chamar novamente e retornar likesCount atualizado (247 ms)
      √ deve curtir reply usando o mesmo endpoint de comentários (235 ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        5.341 s, estimated 7 s
Ran all test suites within paths "tests/truth-comments.routes.test.ts".

## Interpretação

Os testes automatizados confirmam que o backend de comentários reais em truths está funcionando corretamente, cobrindo listagem, criação de comentários, criação de replies e curtidas em comentários e respostas.

Os testes garantem que:

- o endpoint de comentários exige autenticação para acessar os dados da truth

- o sistema retorna corretamente uma lista vazia quando ainda não há comentários

- comentários reais são retornados com dados mínimos do autor, replies, contador de curtidas e estado `likedByMe`

- o backend valida a existência da truth antes de listar ou criar comentários

- o sistema permite criar comentários raiz persistidos no banco

- o sistema permite criar replies associadas a comentários raiz

- o backend rejeita comentários vazios

- o backend impede replies em segundo nível, mantendo apenas uma camada de resposta

- o backend impede reply cruzada em comentário pertencente a outra truth

- o sistema permite curtir e descurtir comentários mantendo `likesCount` atualizado

- o mesmo endpoint de like funciona tanto para comentários raiz quanto para replies

## Conclusão

A suíte `truth-comments.routes.test.ts` valida com sucesso o backend de comentários reais para truths, garantindo autenticação, validações de entrada, persistência no banco, suporte a replies e integração com o sistema genérico de likes.
