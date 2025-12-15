# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT VARIABLES - CRM Casal do Tráfego
# ─────────────────────────────────────────────────────────────────────────────
# 
# Copie este arquivo para .env.local e preencha os valores.
# NUNCA commite o arquivo .env.local!
#

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE (Neon)
# ─────────────────────────────────────────────────────────────────────────────
# Obtenha em: https://console.neon.tech
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"

# ─────────────────────────────────────────────────────────────────────────────
# AI (OpenAI)
# ─────────────────────────────────────────────────────────────────────────────
# Obtenha em: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-..."

# ─────────────────────────────────────────────────────────────────────────────
# WHATSAPP (Meta Business)
# ─────────────────────────────────────────────────────────────────────────────
# Obtenha em: https://developers.facebook.com/apps/
WHATSAPP_TOKEN="Bearer token para enviar mensagens"
WHATSAPP_PHONE_ID="ID do número de telefone"
WHATSAPP_VERIFY_TOKEN="Token para verificação do webhook"
WHATSAPP_APP_SECRET="Secret para validar assinatura"

# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE (OAuth + APIs)
# ─────────────────────────────────────────────────────────────────────────────
# Obtenha em: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="client_secret"
GOOGLE_LEADS_SHEET_ID="ID da planilha de leads"

# ─────────────────────────────────────────────────────────────────────────────
# ENCRYPTION
# ─────────────────────────────────────────────────────────────────────────────
# Gere com: openssl rand -hex 32
ENCRYPTION_KEY="chave-de-32-bytes-para-criptografia"

# ─────────────────────────────────────────────────────────────────────────────
# AUTH (NextAuth)
# ─────────────────────────────────────────────────────────────────────────────
# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET="secret-para-jwt"
NEXTAUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────────────────────
NODE_ENV="development"
