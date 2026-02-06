# Guia de Configuração - HyperDash

## Variáveis de Ambiente

Antes de rodar a aplicação, você precisa configurar o arquivo `.env` na raiz do projeto.

### 1. Banco de Dados (Neon Postgres)

```env
DATABASE_URL="postgresql://usuario:senha@seu-projeto.neon.tech/neondb?sslmode=require"
```

**Como obter:**

1. Acesse [Neon.tech](https://neon.tech)
2. Crie um novo projeto ou use existente
3. Copie a connection string da dashboard
4. Cole no `.env`

---

### 2. Google OAuth (Autenticação)

```env
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxx"
```

**Como obter:**

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **OAuth client ID**
5. Tipo: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copie o Client ID e Client Secret

**Escopos necessários:**

- `https://www.googleapis.com/auth/adwords` (Google Ads)
- `https://www.googleapis.com/auth/analytics.readonly` (Google Analytics)

---

### 3. Meta/Facebook Integration (Para buscar dados de anúncios)

```env
META_APP_ID="1234567890123456"
META_APP_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
META_ACCESS_TOKEN="seu-token-de-longa-duracao"
```

**Como obter:**

1. Acesse [Meta for Developers](https://developers.facebook.com)
2. Crie um novo App ou use existente
3. Adicione o produto **Marketing API**
4. Em **Settings** → **Basic**, copie:
   - App ID
   - App Secret
5. Gere um Access Token de longa duração (60 dias):
   - Vá em **Tools** → **Access Token Tool**
   - Gere um User Access Token
   - Use o [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) para converter em long-lived token

**Permissões necessárias:**

- `ads_read`
- `business_management`
- `ads_management`

---

### 4. Chaves de Segurança (Já Geradas)

Essas chaves já foram geradas automaticamente. **Não altere sem necessidade.**

```env
NEXTAUTH_SECRET="b129fb71e94f492431445a6a1d71ab5fb089fcc65779fdfadc7132a25a2a45b8"
ENCRYPTION_KEY="2fdefa7ea760acb9690c84523cea62cd"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Após Configurar

### 1. Sincronizar Banco de Dados

```bash
npx drizzle-kit push
```

Isso criará todas as tabelas no seu banco Neon.

### 2. Rodar a Aplicação

```bash
npm run dev
```

### 3. Acessar

Abra no navegador: `http://localhost:3000/auth/signin`

---

## Estrutura do .env Completo

```env
# Database
DATABASE_URL="postgresql://..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# NextAuth
NEXTAUTH_SECRET="b129fb71e94f492431445a6a1d71ab5fb089fcc65779fdfadc7132a25a2a45b8"
NEXTAUTH_URL="http://localhost:3000"

# Security
ENCRYPTION_KEY="2fdefa7ea760acb9690c84523cea62cd"

# Meta Integration
META_APP_ID="..."
META_APP_SECRET="..."
META_ACCESS_TOKEN="..."
```

---

## Troubleshooting

### Erro: "Database connection string is not a valid URL"

- Verifique se o `DATABASE_URL` está no formato correto
- Deve começar com `postgresql://`

### Erro no build do Next.js

- Certifique-se de que todas as variáveis estão preenchidas
- Rode `npm install` novamente se necessário

### Token do Google expira

- Os tokens de acesso expiram. O sistema usa `refresh_token` automaticamente.
- Garanta que o scope `access_type: offline` está configurado (já está no código).
