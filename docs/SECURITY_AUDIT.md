# Security Audit

## Data Protection

### OAuth Tokens

- **Algorithm**: AES-256-CBC
- **Storage**: `integrations` table in Postgres.
- **Implementation**: `src/lib/encryption.ts`
- **Keys**:
  - `access_token` and `refresh_token` are encrypted before INSERT.
  - Decrypted only in memory during API calls.
  - `ENCRYPTION_KEY` stored in environment variables (never committed).

### Multi-tenancy

- **Isolation**: Structural enforcement via `organizationId`.
- **Policy**: every database query must include `where(eq(schema.table.organizationId, userOrgId))`.

### PII (Personally Identifiable Information)

- User emails are stored in the `users` table.
- No end-customer PII (e.g., lead data) is currently stored, only aggregated metrics.
