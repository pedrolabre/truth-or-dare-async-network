# Resultados do teste de carga da autenticação

### Arquivo testado
`backend/performance/auth-load.yml`

### Ferramenta utilizada
- Artillery

### Cenário executado
Fluxo completo de autenticação com:
1. cadastro (`POST /auth/signup`)
2. login (`POST /auth/login`)

### Configuração da carga
- fase 1: warm up por 10 segundos com `arrivalRate` 2
- fase 2: baseline load por 15 segundos com `arrivalRate` 5

### Resultado
```Phase started: warm up (index: 0, duration: 10s) 17:21:54(-0300)

Phase completed: warm up (index: 0, duration: 10s) 17:22:04(-0300)

Phase started: baseline load (index: 1, duration: 15s) 17:22:04(-0300)

Phase completed: baseline load (index: 1, duration: 15s) 17:22:19(-0300)

--------------------------------------
Metrics for period to: 17:22:00(-0300) (width: 4.228s)
--------------------------------------

http.codes.200: ................................................................ 10
http.codes.201: ................................................................ 10
http.downloaded_bytes: ......................................................... 8780
http.request_rate: ............................................................. 4/sec
http.requests: ................................................................. 20
http.response_time:
  min: ......................................................................... 74
  max: ......................................................................... 742
  mean: ........................................................................ 157.8
  median: ...................................................................... 89.1
  p95: ......................................................................... 699.4
  p99: ......................................................................... 699.4
http.response_time.2xx:
  min: ......................................................................... 74
  max: ......................................................................... 742
  mean: ........................................................................ 157.8
  median: ...................................................................... 89.1
  p95: ......................................................................... 699.4
  p99: ......................................................................... 699.4
http.responses: ................................................................ 20
vusers.completed: .............................................................. 10
vusers.created: ................................................................ 10
vusers.created_by_name.signup and login flow: .................................. 10
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 166.6
  max: ......................................................................... 943.1
  mean: ........................................................................ 338.5
  median: ...................................................................... 179.5
  p95: ......................................................................... 889.1
  p99: ......................................................................... 889.1


--------------------------------------
Metrics for period to: 17:22:10(-0300) (width: 9.393s)
--------------------------------------

http.codes.200: ................................................................ 35
http.codes.201: ................................................................ 35
http.downloaded_bytes: ......................................................... 30730
http.request_rate: ............................................................. 10/sec
http.requests: ................................................................. 70
http.response_time:
  min: ......................................................................... 72
  max: ......................................................................... 590
  mean: ........................................................................ 92.2
  median: ...................................................................... 82.3
  p95: ......................................................................... 100.5
  p99: ......................................................................... 179.5
http.response_time.2xx:
  min: ......................................................................... 72
  max: ......................................................................... 590
  mean: ........................................................................ 92.2
  median: ...................................................................... 82.3
  p95: ......................................................................... 100.5
  p99: ......................................................................... 179.5
http.responses: ................................................................ 70
vusers.completed: .............................................................. 35
vusers.created: ................................................................ 35
vusers.created_by_name.signup and login flow: .................................. 35
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 157.5
  max: ......................................................................... 670.4
  mean: ........................................................................ 195.2
  median: ...................................................................... 172.5
  p95: ......................................................................... 237.5
  p99: ......................................................................... 267.8


--------------------------------------
Metrics for period to: 17:22:20(-0300) (width: 9.391s)
--------------------------------------

http.codes.200: ................................................................ 50
http.codes.201: ................................................................ 50
http.downloaded_bytes: ......................................................... 43900
http.request_rate: ............................................................. 10/sec
http.requests: ................................................................. 100
http.response_time:
  min: ......................................................................... 74
  max: ......................................................................... 101
  mean: ........................................................................ 84.6
  median: ...................................................................... 83.9
  p95: ......................................................................... 89.1
  p99: ......................................................................... 100.5
http.response_time.2xx:
  min: ......................................................................... 74
  max: ......................................................................... 101
  mean: ........................................................................ 84.6
  median: ...................................................................... 83.9
  p95: ......................................................................... 89.1
  p99: ......................................................................... 100.5
http.responses: ................................................................ 100
vusers.completed: .............................................................. 50
vusers.created: ................................................................ 50
vusers.created_by_name.signup and login flow: .................................. 50
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 162.8
  max: ......................................................................... 193.4
  mean: ........................................................................ 175.3
  median: ...................................................................... 175.9
  p95: ......................................................................... 183.1
  p99: ......................................................................... 183.1


All VUs finished. Total time: 25 seconds

--------------------------------
Summary report @ 17:22:21(-0300)
--------------------------------

http.codes.200: ................................................................ 95
http.codes.201: ................................................................ 95
http.downloaded_bytes: ......................................................... 83410
http.request_rate: ............................................................. 10/sec
http.requests: ................................................................. 190
http.response_time:
  min: ......................................................................... 72
  max: ......................................................................... 742
  mean: ........................................................................ 95.1
  median: ...................................................................... 83.9
  p95: ......................................................................... 106.7
  p99: ......................................................................... 584.2
http.response_time.2xx:
  min: ......................................................................... 72
  max: ......................................................................... 742
  mean: ........................................................................ 95.1
  median: ...................................................................... 83.9
  p95: ......................................................................... 106.7
  p99: ......................................................................... 584.2
http.responses: ................................................................ 190
vusers.completed: .............................................................. 95
vusers.created: ................................................................ 95
vusers.created_by_name.signup and login flow: .................................. 95
vusers.failed: ................................................................. 0
vusers.session_length:
  min: ......................................................................... 157.5
  max: ......................................................................... 943.1
  mean: ........................................................................ 199.8
  median: ...................................................................... 175.9
  p95: ......................................................................... 242.3
  p99: ......................................................................... 889.1
```

### Interpretação

#### 1. Estabilidade geral do sistema
O backend suportou corretamente o fluxo completo de autenticação sob carga leve, sem registrar falhas em nenhuma fase do experimento.

- Total de usuários virtuais concluídos: **95**
- Usuários com falha: **0 (`vusers.failed: 0`)**
- Todas as requisições foram bem-sucedidas:
  - **95 respostas HTTP 200 (login)**
  - **95 respostas HTTP 201 (signup)**
  - Total: **190 respostas**

Isso indica que:
- todos os fluxos de **cadastro + login foram concluídos com sucesso**
- não houve perda de requisições
- não houve inconsistência funcional

---

#### 2. Comportamento durante o warm up (fase inicial)
Durante o período inicial (warm up), foi observada maior variabilidade na latência:

- Média: **157,8 ms**
- Máximo: **742 ms**
- Mediana: **89,1 ms**
- p95: **699,4 ms**
- p99: **699,4 ms**

Interpretação:
- esse comportamento é esperado em sistemas Node.js
- representa o momento de:
  - inicialização de conexões com banco (Prisma/PostgreSQL)
  - primeiro uso do bcrypt (hash)
  - carregamento de dependências
  - possíveis otimizações internas (JIT)

Importante:
- mesmo com picos altos, **não houve falhas**
- o sistema manteve funcionalidade completa

---

#### 3. Estabilização durante a carga (baseline load)
Após o aquecimento, o sistema apresentou estabilização clara.

##### Segundo intervalo (início da carga)
- Taxa: **10 req/s**
- Média: **92,2 ms**
- Mediana: **82,3 ms**
- p95: **100,5 ms**
- p99: **179,5 ms**
- Máximo: **590 ms**

##### Terceiro intervalo (estabilidade consolidada)
- Média: **84,6 ms**
- Mediana: **83,9 ms**
- p95: **89,1 ms**
- p99: **100,5 ms**
- Máximo: **101 ms**

Interpretação:
- redução significativa da variabilidade
- latência consistente e baixa
- sistema operando de forma previsível
- ausência de degradação sob carga constante

---

#### 4. Análise consolidada (resultado final)
No relatório final:

- Média: **95,1 ms**
- Mediana: **83,9 ms**
- p95: **106,7 ms**
- p99: **584,2 ms**
- Mínimo: **72 ms**
- Máximo: **742 ms**

Interpretação:
- maior parte das requisições ficou abaixo de **100 ms**
- p95 baixo indica **consistência**
- p99 elevado representa **picos isolados**
- esses picos estão concentrados no início da execução

Causas prováveis:
- custo de hash com bcrypt
- inicialização de conexões
- primeira interação com banco
- overhead inicial do ambiente

Importante:
- não houve impacto na disponibilidade
- não houve falhas associadas aos picos

---

#### 5. Tempo de sessão dos usuários virtuais
Tempo para completar o fluxo completo (signup + login):

- Média: **199,8 ms**
- Mediana: **175,9 ms**
- p95: **242,3 ms**
- Máximo: **943,1 ms**

Interpretação:
- fluxo completo executado rapidamente na maioria dos casos
- boa fluidez do sistema
- variações maiores concentradas no início (warm up)

---

#### 6. Throughput e capacidade
- Taxa sustentada: **10 requisições por segundo**
- Total de requisições: **190**
- Total de usuários simulados: **95**

Interpretação:
- backend manteve taxa estável
- nenhuma queda de performance ao longo da execução
- capacidade adequada para cenário inicial (MVP)

---

### Conclusão

O backend de autenticação demonstrou comportamento estável, consistente e confiável sob a carga aplicada.

Principais evidências:
- **0% de falhas**
- **100% das requisições concluídas com sucesso**
- **latência média baixa (~95 ms)**
- **p95 controlado (~106 ms)**
- **throughput estável (10 req/s)**

Os picos observados (p99 e máximos) ocorreram principalmente durante a fase de aquecimento e não comprometeram:
- a disponibilidade do sistema
- a integridade dos dados
- a continuidade do fluxo de autenticação

Após essa fase inicial, o sistema apresentou:
- baixa variabilidade
- respostas rápidas e consistentes
- comportamento previsível sob carga

Dessa forma, para o escopo atual do projeto, o backend está apto a:
- sustentar o fluxo de autenticação
- operar com boa performance
- garantir confiabilidade em cenários de carga leve

O sistema pode, portanto, ser considerado pronto para a próxima etapa de evolução: **integração com o frontend mobile (Expo)**.