# 📱 Testes de Frontend — Login Screen

**Data:** 2026-03-29  
**Projeto:** Truth or Dare Async Network  
**Módulo:** Mobile (Expo / React Native)  
**Arquivo testado:** `\\\\\\\\\\\\\\\_\\\\\\\\\\\\\\\_tests\\\\\\\\\\\\\\\_\\\\\\\\\\\\\\\_/login-screen-test.tsx`

\---

## 🛠 Ferramentas de Teste

* **Jest** — executor da suíte de testes
* **jest-expo** — preset de testes para ambiente Expo
* **@testing-library/react-native** — renderização e interação com componentes React Native
* **Mocks com Jest** — simulação da camada de API (`login`)
* **Alert spy** — verificação do comportamento visual de erro

\---

## 🧪 Visão Geral

Os testes realizados validam o comportamento da tela de login (`LoginScreen`), incluindo:

* Estado inicial da interface
* Validação de preenchimento do formulário
* Integração com API de autenticação
* Tratamento de erros

\---

## 📊 Resultado

PASS  __tests__/login-screen-test.tsx (6.56 s)
  LoginScreen
    √ deve começar com o botão desabilitado (173 ms)
    √ deve habilitar o botão quando os campos estiverem preenchidos (24 ms)
    √ deve chamar login com os dados corretos (44 ms)
    √ deve mostrar alerta quando a API retornar erro (105 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        6.908 s

\---

## 🧾 Execução dos Testes

```bash
npm test
```

\---

## 📌 Casos de Teste

### 1\. Estado inicial do botão

**Descrição:**

Verifica se o botão de login inicia desabilitado quando nenhum campo está preenchido.

**Resultado:** ✔ Passou

**Validação realizada:**

* Campos vazios
* Botão desabilitado

\---

### 2\. Habilitação do botão

**Descrição:**

Verifica se o botão é habilitado quando:

* Email preenchido
* Senha preenchida

**Resultado:** ✔ Passou

**Validação realizada:**

* Simulação de input nos campos
* Botão ativo

\---

### 3\. Chamada da API de login

**Descrição:**

Valida se a função `login` é chamada com os dados corretos.

**Resultado:** ✔ Passou

**Validação realizada:**

* Envio correto de:

  * email
  * password

**Log capturado:**

```txt
Usuário autenticado: {
  user: {
    id: '1',
    name: 'Pedro',
    email: 'teste@mail.com',
    createdAt: '2026-03-29T00:00:00.000Z'
  },
  token: 'fake-token'
}
```

\---

### 4\. Tratamento de erro da API

**Descrição:**

Verifica se o sistema exibe alerta quando a API retorna erro.

**Resultado:** ✔ Passou

**Validação realizada:**

* Simulação de erro
* Exibição de alerta

**Mensagem esperada:**

```txt
Erro no login  
E-mail ou senha inválidos
```

\---

## ⚠️ Avisos (Warnings)

### act(...) warning

```txt
An update to Icon inside a test was not wrapped in act(...)
```

**Origem:**
`@expo/vector-icons`

**Impacto:**

* Não quebra os testes
* Não afeta o resultado
* Apenas ruído

**Status:**
Pode ser ignorado no momento

\---

## 🧠 Interpretação Técnica

### ✔ Pontos positivos

* Fluxo completo validado
* Integração com API testada
* Estados da UI consistentes
* Tratamento de erro funcionando
* Estrutura de testes reutilizável

\---

### ⚠ Pontos de atenção

* Warnings de `act(...)`
* Logs aparecem durante testes
* Dependência de `accessibilityState` nos testes

\---

## 🚀 Nível de maturidade

O módulo de login apresenta:

* Confiabilidade
* Previsibilidade
* Boa cobertura funcional

Classificação: **Intermediário → Avançado**

\---

## 🔜 Próximos Passos

1. Testes de navegação pós-login
2. Persistência de sessão (token)
3. Testes de logout
4. Mock de ícones
5. Limpeza de logs

\---

## ✅ Conclusão

O fluxo de login está:

✔ Funcional  
✔ Testado  
✔ Estável  
✔ Pronto para evolução

Sem falhas críticas identificadas.

