# ============================================
# RUN LOCAL BACKEND (EXEMPLO)
# ============================================
#
# Este script configura variáveis de ambiente
# para rodar o backend localmente.
#
# 👉 IMPORTANTE:
# - NÃO use valores reais aqui
# - Copie este arquivo e crie sua versão:
#     run-local.ps1
# - Ajuste os valores conforme seu ambiente
#
# ============================================


# --------------------------------------------
# DATABASE
# --------------------------------------------
# String de conexão com seu PostgreSQL local
# Ajuste:
# - usuário
# - senha
# - porta
# - nome do banco

$env:DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/YOUR_DB_NAME?sslmode=disable"

# URL direta usada pelo Prisma (migrations)
$env:DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/YOUR_DB_NAME?sslmode=disable"


# --------------------------------------------
# SERVER
# --------------------------------------------

# Porta do backend
$env:PORT="3333"


# --------------------------------------------
# AUTH
# --------------------------------------------

# Segredo do JWT (trocar por algo seguro)
$env:JWT_SECRET="your-secret-key"


# --------------------------------------------
# START SERVER
# --------------------------------------------

npm run dev