## Arquivo testado

`backend/tests/truth-comments.routes.test.ts`

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL
- dotenv-cli
- Banco isolado de testes via `.env.test`

## Comando executado

```powershell
npx dotenv -e .env.test -- npm test -- --runTestsByPath tests/truth-comments.routes.test.ts
```

## Banco utilizado

Banco de testes:

`truth_or_dare_test`

Durante a execução, o banco de testes foi resetado e recebeu as migrations necessárias antes da suíte ser executada.

Migrations aplicadas:

- `20260328161030_init`
- `20260331155538_create_feed_domain_models`
- `20260404141910_add_target_user_to_truths_and_dares`
- `20260405031052_add_dare_progress_fields`
- `20260405134121_add_likes`
- `20260408191756_add_username_and_bio_to_user`
- `20260504162510_add_dare_proofs`
- `20260506134926_add_truth_comments`
- `20260508150924_add_truth_reports`

## Cenários validados

### Listagem de comentários

1. Rejeição da listagem de comentários quando o token não é informado

2. Listagem vazia quando a truth ainda não possui comentários

3. Listagem de comentários reais com autor, replies, `likesCount` e `likedByMe`

4. Retorno de `canEdit` e `canDelete` como `true` para comentários e replies do próprio usuário autenticado

5. Retorno de `canEdit` e `canDelete` como `false` para comentários e replies de outro usuário

6. Retorno de erro 404 quando a truth informada não existe

### Criação de comentários e replies

7. Criação de comentário raiz real para usuário autenticado

8. Retorno de `canEdit` e `canDelete` como `true` ao criar comentário raiz

9. Criação de reply real associada a um comentário raiz

10. Retorno de `canEdit` e `canDelete` como `true` ao criar reply

11. Validação de erro quando o texto do comentário está vazio

12. Bloqueio de resposta em segundo nível ao tentar responder uma reply

13. Validação de erro quando o comentário pai pertence a outra truth

14. Validação de erro ao tentar comentar em uma truth inexistente

### Edição de comentários e replies

15. Edição de comentário raiz quando o usuário autenticado é o autor

16. Persistência do novo texto do comentário raiz no banco

17. Edição de reply quando o usuário autenticado é o autor

18. Persistência do novo texto da reply no banco

19. Rejeição da edição quando o token não é informado

20. Bloqueio de edição quando o usuário autenticado não é o autor do comentário

21. Preservação do texto original quando a edição é recusada por falta de permissão

22. Retorno de erro 404 ao tentar editar comentário inexistente

23. Rejeição da edição quando o texto está vazio

24. Preservação do texto original quando a edição é recusada por texto vazio

25. Rejeição da edição quando o texto excede o limite máximo

26. Preservação do texto original quando a edição é recusada por limite máximo

### Exclusão de comentários e replies

27. Exclusão de comentário raiz quando o usuário autenticado é o autor

28. Remoção em cascade das replies ao excluir comentário raiz

29. Limpeza manual dos likes associados ao comentário raiz excluído

30. Limpeza manual dos likes associados às replies removidas junto do comentário raiz

31. Exclusão isolada de reply quando o alvo é uma resposta

32. Preservação do comentário raiz ao excluir apenas uma reply

33. Limpeza manual dos likes associados à reply excluída

34. Rejeição da exclusão quando o token não é informado

35. Bloqueio da exclusão quando o usuário autenticado não é o autor do comentário

36. Preservação do comentário quando a exclusão é recusada por falta de permissão

37. Retorno de erro 404 ao tentar excluir comentário inexistente

### Denúncias de truths

38. Criação de denúncia real de truth por usuário autenticado que não é o autor

39. Persistência da denúncia de truth no banco

40. Rejeição da denúncia de truth quando o token não é informado

41. Retorno de erro 404 ao denunciar truth inexistente

42. Bloqueio de denúncia da própria truth

43. Garantia de que denúncia da própria truth não é persistida

44. Bloqueio de denúncia duplicada da mesma truth pelo mesmo usuário

45. Garantia de que denúncia duplicada não cria novo registro

46. Rejeição de denúncia de truth com motivo inválido

47. Rejeição de denúncia de truth com detalhes acima do limite máximo

### Denúncias de comentários e replies

48. Criação de denúncia real de comentário por usuário autenticado que não é o autor

49. Persistência da denúncia de comentário no banco

50. Criação de denúncia real de reply usando o mesmo endpoint de denúncia de comentários

51. Persistência da denúncia de reply no banco

52. Rejeição da denúncia de comentário quando o token não é informado

53. Retorno de erro 404 ao denunciar comentário inexistente

54. Bloqueio de denúncia do próprio comentário

55. Garantia de que denúncia do próprio comentário não é persistida

56. Bloqueio de denúncia duplicada do mesmo comentário pelo mesmo usuário

57. Garantia de que denúncia duplicada de comentário não cria novo registro

58. Rejeição de denúncia de comentário com motivo inválido

59. Rejeição de denúncia de comentário com detalhes acima do limite máximo

### Likes em comentários e replies

60. Criação de like em comentário com retorno de `liked: true` e `likesCount` atualizado

61. Persistência do like de comentário no banco

62. Remoção de like em comentário ao chamar o endpoint novamente

63. Atualização de `likesCount` ao remover a curtida

64. Criação de like em reply usando o mesmo endpoint de comentários

## Resultado da execução

PASS  tests/truth-comments.routes.test.ts

  Truth comments routes
    GET /truths/:id/comments
      √ deve retornar 401 quando o token não for informado
      √ deve retornar lista vazia quando a truth ainda não tiver comentários
      √ deve retornar comentários reais com autor, replies, likesCount e likedByMe
      √ deve retornar canEdit e canDelete falsos para comentários de outro usuário
      √ deve retornar 404 quando a truth não existir

    POST /truths/:id/comments
      √ deve criar comentário raiz real para usuário autenticado
      √ deve criar reply real associado a um comentário raiz
      √ deve retornar 400 quando o texto estiver vazio
      √ deve retornar 400 quando tentar responder uma resposta
      √ deve retornar 404 quando o comentário pai não pertencer à mesma truth
      √ deve retornar 404 quando a truth não existir

    PATCH /truths/comments/:id
      √ deve editar comentário raiz quando o usuário autenticado for o autor
      √ deve editar reply quando o usuário autenticado for o autor
      √ deve retornar 401 quando tentar editar sem token
      √ deve retornar 403 quando usuário não for autor do comentário
      √ deve retornar 404 quando comentário não existir
      √ deve retornar 400 quando o texto editado estiver vazio
      √ deve retornar 400 quando o texto editado exceder o limite máximo

    DELETE /truths/comments/:id
      √ deve excluir comentário raiz e remover replies e likes associados
      √ deve excluir apenas a reply quando o alvo for uma resposta
      √ deve retornar 401 quando tentar excluir sem token
      √ deve retornar 403 quando usuário não for autor do comentário
      √ deve retornar 404 quando comentário não existir

    POST /truths/:id/report
      √ deve denunciar uma truth existente quando usuário autenticado não for o autor
      √ deve retornar 401 ao denunciar truth sem token
      √ deve retornar 404 ao denunciar truth inexistente
      √ deve retornar 400 ao denunciar a própria truth
      √ deve retornar 409 ao denunciar a mesma truth duas vezes pelo mesmo usuário
      √ deve retornar 400 quando o motivo da denúncia da truth for inválido
      √ deve retornar 400 quando os detalhes da denúncia da truth excederem o limite

    POST /truths/comments/:id/report
      √ deve denunciar um comentário existente quando usuário autenticado não for o autor
      √ deve denunciar uma reply usando o mesmo endpoint de denúncia de comentários
      √ deve retornar 401 ao denunciar comentário sem token
      √ deve retornar 404 ao denunciar comentário inexistente
      √ deve retornar 400 ao denunciar o próprio comentário
      √ deve retornar 409 ao denunciar o mesmo comentário duas vezes pelo mesmo usuário
      √ deve retornar 400 quando o motivo da denúncia do comentário for inválido
      √ deve retornar 400 quando os detalhes da denúncia do comentário excederem o limite

    POST /truths/comments/:id/like
      √ deve curtir comentário e retornar liked true com likesCount atualizado
      √ deve remover curtida ao chamar novamente e retornar likesCount atualizado
      √ deve curtir reply usando o mesmo endpoint de comentários

Test Suites: 1 passed, 1 total
Tests:       41 passed, 41 total
Snapshots:   0 total

## Interpretação

Os testes automatizados confirmam que o backend de comentários de truths está funcionando corretamente em todo o fluxo implementado nos últimos commits.

A suíte valida a base real de comentários, replies e likes, além do gerenciamento de comentários e do sistema de denúncias reais em truths e comentários.

Os testes garantem que:

- o endpoint de comentários exige autenticação para acessar os dados da truth

- o sistema retorna lista vazia quando ainda não há comentários

- comentários e replies são retornados com dados mínimos do autor, contagem de curtidas e estado `likedByMe`

- comentários e replies retornam corretamente os campos `canEdit` e `canDelete`

- o autor do comentário pode editar e excluir seus próprios comentários e replies

- usuários que não são autores não podem editar ou excluir comentários de terceiros

- comentários inexistentes são tratados corretamente nas operações de edição e exclusão

- textos vazios ou acima do limite são recusados na edição

- a exclusão de comentário raiz remove suas replies

- a exclusão de comentário raiz e reply remove os likes associados ao alvo excluído

- replies podem ser excluídas sem remover o comentário raiz

- truths podem ser denunciadas por usuários autenticados que não sejam autores

- comentários e replies podem ser denunciados por usuários autenticados que não sejam autores

- denúncias duplicadas são bloqueadas

- denúncias contra conteúdo próprio são bloqueadas

- motivos inválidos de denúncia são recusados

- detalhes de denúncia acima do limite são recusados

- o sistema de likes funciona para comentários raiz e replies

## Conclusão

A suíte `truth-comments.routes.test.ts` valida com sucesso o backend de comentários reais em truths, incluindo listagem, criação, replies, curtidas, edição, exclusão, permissões visuais com `canEdit` e `canDelete`, limpeza de likes após exclusão e denúncias reais de truths, comentários e replies.

A execução com `.env.test` confirma que os testes foram realizados contra o banco isolado `truth_or_dare_test`, preservando o ambiente de desenvolvimento e garantindo validação segura das rotas implementadas.
