<div align="center">

# 🎭 Truth or Dare Async Network
*(Rede Social Assíncrona de Verdade e Desafio)*

---
</div>

Uma plataforma social baseada no jogo **“Verdade ou Desafio”**, desenvolvida para dispositivos móveis utilizando **React Native**. A proposta é permitir que usuários criem e participem de desafios de forma assíncrona, ou seja, sem a necessidade de todos estarem conectados ao mesmo tempo.

Os usuários poderão criar desafios do tipo *verdade* ou *desafio* para grupos de amigos ou para a comunidade do aplicativo, respondendo com texto ou imagens. O sistema também contará com funcionalidades típicas de redes sociais, como:
* Perfis de usuário
* Feed de desafios
* Interação entre participantes
* Criação de grupos

Tudo isso promovendo uma experiência social e interativa dentro da plataforma.

## 🎨 Protótipos de Interface

As telas abaixo representam o fluxo principal da aplicação. Sub-telas de interações (como modais de erro, configurações específicas e denúncias) estão disponíveis dentro de seus respectivos diretórios na pasta `/prototype`.

---

<details>
<summary><strong>🔐 1. Autenticação</strong></summary>

<br>

### Tela de Login
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/login-screen/tela-de-login-modo-claro.png" width="250"> | <img src="prototype/dark-mode/login-screen/tela-de-login-modo-escuro.png" width="250"> |

### Tela de Cadastro
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/signup-screen/tela-de-cadastro-modo-claro.png" width="250"> | <img src="prototype/dark-mode/signup-screen/tela-de-cadastro-modo-escuro.png" width="250"> |

</details>

---

<details>
<summary><strong>🔁 2. Recuperação de Senha</strong></summary>

<br>

### Solicitação de Recuperação
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/forgot-password-screen/tela-de-recuperacao-de-senha.png" width="250"> | <img src="prototype/dark-mode/forgot-password-screen/tela-de-recuperacao-de-senha-modo-escuro.png" width="250"> |

### Verificação de Código
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/verify-code-screen/tela-de-confirmacao-de-codigo.png" width="250"> | <img src="prototype/dark-mode/verify-code-screen/tela-de-confirmacao-de-codigo-modo-escuro.png" width="250"> |

### Redefinição de Senha
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/reset-password-screen/tela-de-modificacao-de-senha.png" width="250"> | <img src="prototype/dark-mode/reset-password-screen/tela-de-modificacao-de-senha-modo-escuro.png" width="250"> |

### Sucesso na Alteração
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/password-success-screen/tela-de-senha-alterada-sucesso.png" width="250"> | <img src="prototype/dark-mode/password-success-screen/tela-de-senha-alterada-sucesso-modo-escuro.png" width="250"> |

</details>

---

<details>
<summary><strong>🏠 3. Área Logada: Feed e Ações</strong></summary>

<br>

### Feed Principal
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/feed-screen/tela-do-feed-modo-claro.png" width="250"> | <img src="prototype/dark-mode/feed-screen/tela-do-feed-modo-escuro.png" width="250"> |

### Ação (Câmera)
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/action-screen/tela-da-camera-modo-claro.png" width="250"> | <img src="prototype/dark-mode/action-screen/tela-da-camera-modo-escuro.png" width="250"> |

### Detalhes do Resultado (Proof Detail)
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/proof-detail-screen/tela-de-resultado-modo-claro.png" width="250"> | <img src="prototype/dark-mode/proof-detail-screen/tela-de-resultado-modo-escuro.png" width="250"> |

### Criar Novo Desafio
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/create-challenge-screen/tela-de-criar-verdade-ou-desafio-modo-claro.png" width="250"> | <img src="prototype/dark-mode/create-challenge-screen/tela-de-criar-verdade-ou-desafio-modo-escuro.png" width="250"> |

### Respostas e Comentários
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/answers-screen/tela-de-respostas-e-comentarios.png" width="250"> | <img src="prototype/dark-mode/answers-screen/tela-de-respostas-e-comentarios-modo-escuro.png" width="250"> |

</details>

---

<details>
<summary><strong>🔍 4. Busca e Perfis</strong></summary>

<br>

### Tela de Busca
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/search-screen/tela-de-busca-modo-claro.png" width="250"> | <img src="prototype/dark-mode/search-screen/tela-de-busca-modo-escuro.png" width="250"> |

### Perfil Público (Outros Usuários)
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/public-profile-screen/tela-de-perfil-publico-modo-claro.png" width="250"> | <img src="prototype/dark-mode/public-profile-screen/tela-de-perfil-publico-modo-escuro.png" width="250"> |

### Meu Perfil
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/profile-screen/tela-de-perfil-modo-claro.png" width="250"> | <img src="prototype/dark-mode/profile-screen/tela-de-perfil-modo-escuro.png" width="250"> |

</details>

---

<details>
<summary><strong>👥 5. Clubes e Grupos</strong></summary>

<br>

### Feed de Clubes
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/clubs-feed-screen/tela-do-feed-de-clube-modo-claro.png" width="250"> | <img src="prototype/dark-mode/clubs-feed-screen/tela-do-feed-de-clube-modo-escuro.png" width="250"> |

### Perfil do Clube (Mural)
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/club-profile-screen/tela-do-perfil-de-clube-mural.png" width="250"> | <img src="prototype/dark-mode/club-profile-screen/tela-do-perfil-de-clube-mural-modo-escuro.png" width="250"> |

### Criar Novo Grupo
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/create-group-screen/tela-de-criação-de-grupos-modo-claro.png" width="250"> | <img src="prototype/dark-mode/create-group-screen/tela-de-criação-de-grupos-modo-escuro.png" width="250"> |

</details>

---

<details>
<summary><strong>⚙️ 6. Sistema e Configurações</strong></summary>

<br>

### Notificações
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/notifications-screen/tela-de-notificações-modo-claro.png" width="250"> | <img src="prototype/dark-mode/notifications-screen/tela-de-notificações-modo-escuro.png" width="250"> |

### Configurações
| Light Mode | Dark Mode |
| :---: | :---: |
| <img src="prototype/light-mode/settings-screen/tela-de-configuração-modo-claro.png" width="250"> | <img src="prototype/dark-mode/settings-screen/tela-de-configuração-modo-escuro.png" width="250"> |

</details>

---