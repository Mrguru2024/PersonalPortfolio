# Security Guidelines

## Credential Management

### ⚠️ **NEVER commit credentials to the repository!**

All sensitive credentials must be stored in environment variables, never hardcoded in source files.

## Environment Variables

All credentials are stored in `.env.local` which is gitignored. See `.env.example` for required variables.

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random string for session encryption
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `BREVO_API_KEY` - Brevo email service API key

### Script-Specific Variables (Optional)

These are only needed when running admin setup scripts:

- `ADMIN_EMAIL` - Admin user email (for create-admin.ts, reset-admin-password.ts, verify-password.ts)
- `ADMIN_PASSWORD` - Admin user password (for create-admin.ts, reset-admin-password.ts, verify-password.ts)
- `SEED_ADMIN_EMAIL` - Admin email for database seeding (for server/seed.ts)
- `SEED_ADMIN_PASSWORD` - Admin password for database seeding (for server/seed.ts)

## Running Admin Scripts

### Create Admin User

```bash
# Using environment variables (recommended)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secure-password npx tsx scripts/create-admin.ts

# Using command line arguments
npx tsx scripts/create-admin.ts admin@example.com secure-password
```

### Reset Admin Password

```bash
# Using environment variables (recommended)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=new-password npx tsx scripts/reset-admin-password.ts

# Using command line arguments
npx tsx scripts/reset-admin-password.ts admin@example.com new-password
```

### Verify Password

```bash
# Using environment variables (recommended)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password npx tsx scripts/verify-password.ts

# Using command line arguments
npx tsx scripts/verify-password.ts admin@example.com password
```

## Security Checklist

- [x] All credentials use environment variables
- [x] `.env.local` is in `.gitignore`
- [x] `.env.example` exists with placeholder values
- [x] No hardcoded passwords in source code
- [x] No hardcoded API keys in source code
- [x] No hardcoded database URLs in source code
- [x] Admin scripts require credentials as arguments or env vars
- [x] Passwords are never logged or displayed in console output

## If Credentials Are Accidentally Committed

1. **Immediately rotate all exposed credentials:**
   - Change database passwords
   - Regenerate API keys
   - Update OAuth client secrets
   - Generate new session secrets

2. **Remove from git history:**
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner to remove sensitive files
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (coordinate with team):**
   ```bash
   git push origin --force --all
   ```

4. **Review all commits** to ensure no other credentials were exposed

## Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use `.env.example`** as a template for required variables
3. **Rotate credentials regularly** - Especially after team member changes
4. **Use strong passwords** - Minimum 12 characters, mix of letters, numbers, symbols
5. **Limit access** - Only grant admin access to trusted users
6. **Monitor access logs** - Regularly review authentication logs
7. **Use secrets management** - For production, consider using Vercel Secrets or AWS Secrets Manager
