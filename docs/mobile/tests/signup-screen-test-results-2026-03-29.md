# 📱 Testes de Frontend — Signup Screen

**Data:** 2026-03-29  
**Projeto:** Truth or Dare Async Network  
**Módulo:** Mobile (Expo / React Native)  
**Arquivo testado:** `\\\\\\\_\\\\\\\_tests\\\\\\\_\\\\\\\_/signup-screen-test.tsx`

\---

## 🛠 Ferramentas de Teste

* **Jest** — executor da suíte de testes
* **jest-expo** — preset de testes para ambiente Expo
* **@testing-library/react-native** — renderização e interação com componentes React Native
* **Mocks com Jest** — simulação da camada de API (`signup`)
* **Alert spy** — verificação do comportamento visual de erro

\---

## 🧪 Visão Geral

Os testes realizados validam o comportamento da tela de cadastro (`SignupScreen`), incluindo:

* Estado inicial da interface
* Validação de preenchimento do formulário
* Integração com API de cadastro
* Tratamento de erros

\---

## 📊 Resultado Geral

PASS  __tests__/signup-screen-test.tsx (7.349 s)
  SignupScreen
    √ deve começar com o botão desabilitado (307 ms)
    √ deve habilitar o botão quando os campos estiverem preenchidos e os termos aceitos (66 ms)
    √ deve chamar signup com os dados corretos (72 ms)
    √ deve mostrar alerta quando a API retornar erro (124 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        7.797 s, estimated 12 s

\---

## 🧾 Execução dos Testes

```bash
npm test
```

\---

## 📌 Casos de Teste

### 1\. Estado inicial do botão

**Descrição:**

Verifica se o botão de cadastro inicia desabilitado quando nenhum campo está preenchido.

**Resultado:** ✔ Passou

**Validação realizada:**

* Campos vazios
* Termos não aceitos
* Botão desabilitado

\---

### 2\. Habilitação do botão

**Descrição:**

Verifica se o botão é habilitado quando:

* Nome preenchido
* Email preenchido
* Senha preenchida
* Termos aceitos

**Resultado:** ✔ Passou

**Validação realizada:**

* Simulação de input nos campos
* Aceite dos termos
* Botão ativo

\---

### 3\. Chamada da API de signup

**Descrição:**

Valida se a função `signup` é chamada com os dados corretos.

**Mock utilizado:**

```ts
signup.mockResolvedValue(...)
```

**Resultado:** ✔ Passou

**Validação realizada:**

* Envio correto de:

  * name
  * email
  * password

**Log capturado:**

```txt
Usuário criado: {
  user: {
    id: '1',
    name: 'Pedro Roberto',
    email: 'labre@test.com',
    createdAt: '2026-03-29T00:00:00.000Z'
  },
  token: 'fake-token'
}
```

\---

### 4\. Tratamento de erro da API

**Descrição:**

Verifica se o sistema exibe alerta quando a API retorna erro.

**Mock utilizado:**

```ts
signup.mockRejectedValue(new Error(...))
```

**Resultado:** ✔ Passou

**Validação realizada:**

* Simulação de erro
* Exibição de alerta

**Mensagem esperada:**

```txt
Erro no cadastro  
Já existe uma conta com este e-mail
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
* Não há teste de navegação pós-sucesso

\---

## 🚀 Nível de maturidade

O módulo de cadastro apresenta:

* Confiabilidade
* Previsibilidade
* Boa cobertura funcional

Classificação: **Intermediário → Avançado**

\---

## 🔜 Próximos Passos

1. Testes da tela de login
2. Testes de navegação pós-auth
3. Persistência de sessão
4. Mock de ícones
5. Limpeza de logs

\---

## ✅ Conclusão

O fluxo de cadastro está:

✔ Funcional  
✔ Testado  
✔ Estável  
✔ Pronto para evolução

Sem falhas críticas identificadas.

