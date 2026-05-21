## Arquivo testado

`backend/tests/password-reset.routes.test.ts`

## Data de execucao

21/05/2026

## Escopo

- Rotas: POST /auth/forgot-password, POST /auth/verify-reset-code, POST /auth/reset-password

## Ferramentas utilizadas

- Jest
- Supertest
- Prisma
- PostgreSQL

## Cenarios validados

1. Forgot-password: sucesso para e-mail existente, resposta generica para e-mail inexistente, validacao de formato, invalidacao de tokens anteriores e rate limit.
2. Verify-reset-code: sucesso, codigo invalido, max tentativas, expirado, token usado, e-mail inexistente e rate limit.
3. Reset-password: sucesso com login novo, token invalido/expirado/usado, senha fraca, mesma senha anterior e rate limit.


## Resultado da execucao

> backend@1.0.0 test
> jest --runInBand tests/password-reset.routes.test.ts

Determining test suites to run...[dotenv@17.3.1] injecting env (9) from .env.test -- tip: ⚙️  enable debug logging with { debug: true }
🔄 Resetando banco de testes...
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "truth_or_dare_test", schema "public" at "localhost:5432"

Applying migration `20260328161030_init`
...existing migration logs...
Applying migration `20260519142749_add_password_reset_tokens`

Database reset successful

...existing logs...

 PASS  tests/password-reset.routes.test.ts (7.281 s)
	password-reset.routes
		POST /auth/forgot-password
			√ returns ok and creates token for existing email (1098 ms)
			√ invalidates previous active tokens for the same user (370 ms)
			√ returns generic success for unknown email and does not create token (229 ms)
			√ returns validation error for invalid email format (17 ms)
			√ enforces rate limit per email and ip (770 ms)
		POST /auth/verify-reset-code
			√ returns reset token for valid code (346 ms)
			√ enforces rate limit for verify-reset-code (401 ms)
			√ increments attempt count for wrong code (134 ms)
			√ locks token after max attempts (149 ms)
			√ returns invalid or expired for expired code (144 ms)
			√ returns invalid or expired for used token (154 ms)
			√ returns invalid or expired for unknown email (26 ms)
		POST /auth/reset-password
			√ resets password and invalidates remaining tokens (724 ms)
			√ rejects invalid reset token (15 ms)
			√ rejects expired password reset token (111 ms)
			√ rejects already used password reset token (124 ms)
			√ rejects weak password (126 ms)
			√ rejects when new password matches current password (204 ms)
			√ enforces rate limit for reset-password (52 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        7.442 s, estimated 14 s
Ran all test suites matching /tests\\password-reset.routes.test.ts/i.
Exit code: 0
Comando: npm test -- --runInBand tests/password-reset.routes.test.ts

## Interpretação

A execução confirma que a suíte valida o fluxo de recuperação de senha em nível de API, cobrindo as rotas públicas de solicitação de código, verificação de código e redefinição de senha. Os testes exercitam tanto os caminhos de sucesso quanto falhas esperadas, incluindo entradas inválidas, códigos incorretos, tokens expirados, tokens já usados, limite de tentativas, rate limit e regras de senha.

Também fica confirmado que o fluxo mantém propriedades importantes de segurança. A solicitação de recuperação não revela se o e-mail existe, o código não é retornado pela API, o token de recuperação é tratado de forma persistida no banco e o envio de e-mail é simulado por mock durante os testes. A redefinição de senha valida que a senha antiga deixa de autenticar e que a nova senha passa a funcionar, o que confirma o efeito real da troca no fluxo de autenticação.

A execução foi feita contra o banco de testes resetado por migrations, com Prisma e PostgreSQL, sem dependência de envio real de e-mail. Isso mantém a suíte isolada e reproduzível para validar o comportamento backend do fluxo de recuperação de senha.

## Conclusão

A suíte foi executada com sucesso, com 1 suíte aprovada e 19 testes aprovados. O resultado confirma que as rotas de recuperação de senha estão cobertas nos principais cenários funcionais, de validação e de proteção contra abuso.

Com a execução concluída sem falhas, o backend demonstra comportamento consistente para solicitação de recuperação, verificação de código e redefinição de senha. O fluxo valida criação e invalidação de tokens, bloqueio de tentativas inválidas, rejeição de tokens inválidos ou expirados, troca efetiva da senha e isolamento do envio de e-mail por mock durante os testes automatizados.
