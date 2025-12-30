# 🚀 Supabase Backend Migration Guide

This guide will help you migrate your Statement Insights backend from the existing Supabase project to your personal Supabase project.

## 📋 Prerequisites

- [ ] A personal Supabase account ([Sign up here](https://supabase.com))
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Docker Desktop installed and running (for local development)
- [ ] Access to the current Supabase project (optional, for data migration)

---

## 🎯 Migration Steps

### Step 1: Create Your New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the details:
   - **Organization**: Select or create one
   - **Name**: `statement-insights` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
4. Click **"Create new project"**
5. Wait for the project to be provisioned (~2 minutes)

### Step 2: Get Your New Project Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API Key** → `anon` `public` key
   - **Project Reference ID** (from the URL or settings)

### Step 3: Update Environment Variables

Update your `.env` file with the new credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-new-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-new-anon-key"
VITE_SUPABASE_URL="https://your-new-project-id.supabase.co"
```

### Step 4: Update Supabase Configuration

Update `supabase/config.toml`:

```toml
project_id = "your-new-project-id"
```

### Step 5: Link Your Local Project to New Supabase

Open a terminal in your project directory and run:

```bash
# Login to Supabase CLI
supabase login

# Link to your new project
supabase link --project-ref your-new-project-id
```

When prompted, enter your database password from Step 1.

### Step 6: Apply Database Migrations

Run the migration to create all tables, policies, and functions:

```bash
# Push migrations to your new Supabase project
supabase db push
```

This will execute the migration file:
- `supabase/migrations/20251230045557_bdd18298-ce1b-4b3f-98b8-1a89e3551aa8.sql`

This creates:
- ✅ `bank_profiles` table
- ✅ `statements` table
- ✅ `transactions` table
- ✅ `ai_insights` table
- ✅ `transaction_audit_log` table
- ✅ Row Level Security (RLS) policies
- ✅ Storage bucket for statements
- ✅ Indexes for performance

### Step 7: Deploy Edge Function

Deploy the `process-statement` Edge Function:

```bash
# Deploy the Edge Function
supabase functions deploy process-statement
```

If you need to set environment variables for the function:

```bash
# Set secrets for the Edge Function (if needed)
supabase secrets set SOME_API_KEY=your-api-key
```

### Step 8: Configure Storage

The migration automatically creates the `statements` storage bucket. Verify it:

1. Go to **Storage** in Supabase Dashboard
2. You should see a bucket named `statements`
3. Storage policies are already configured for user-specific access

### Step 9: Enable Authentication Providers (Optional)

If you want to enable additional auth providers:

1. Go to **Authentication** → **Providers**
2. Enable the providers you need:
   - Email (enabled by default)
   - Google OAuth
   - GitHub OAuth
   - etc.

### Step 10: Test Your Migration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Try signing up a new user
   - Try logging in

3. **Test functionality:**
   - Create a bank profile
   - Upload a statement
   - View transactions

---

## 📊 Optional: Migrate Existing Data

If you want to migrate data from the old Supabase project:

### Option A: Using Supabase CLI (Recommended)

```bash
# Dump data from old project
supabase db dump --db-url "postgresql://postgres:[OLD_PASSWORD]@db.ztfsgljiqjzkkrajhnce.supabase.co:5432/postgres" --data-only > old_data.sql

# Restore to new project
supabase db reset
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_ID].supabase.co:5432/postgres" < old_data.sql
```

### Option B: Manual Export/Import via Dashboard

1. **Export from old project:**
   - Go to old Supabase Dashboard
   - **Table Editor** → Select each table
   - Click **"..."** → **"Download as CSV"**

2. **Import to new project:**
   - Go to new Supabase Dashboard
   - **Table Editor** → Select table
   - Click **"Insert"** → **"Import data from CSV"**

### Option C: Using pg_dump (Advanced)

```bash
# Export from old database
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.ztfsgljiqjzkkrajhnce.supabase.co:5432/postgres" \
  --data-only \
  --table=bank_profiles \
  --table=statements \
  --table=transactions \
  --table=ai_insights \
  > data_backup.sql

# Import to new database
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_ID].supabase.co:5432/postgres" < data_backup.sql
```

---

## 🔍 Verification Checklist

After migration, verify everything works:

- [ ] Database tables created successfully
- [ ] RLS policies are active
- [ ] Storage bucket exists
- [ ] Edge Function deployed
- [ ] Authentication works (sign up/login)
- [ ] Frontend connects to new backend
- [ ] Can create bank profiles
- [ ] Can upload statements
- [ ] Can view transactions
- [ ] Data (if migrated) is accessible

---

## 🛠️ Troubleshooting

### Issue: "Failed to link project"
**Solution:** Make sure you're logged in to Supabase CLI:
```bash
supabase login
```

### Issue: "Migration failed"
**Solution:** Check if tables already exist. Reset and try again:
```bash
supabase db reset
supabase db push
```

### Issue: "CORS errors in browser"
**Solution:** Verify your `VITE_SUPABASE_URL` in `.env` matches your new project URL.

### Issue: "Authentication not working"
**Solution:** 
1. Check that Email provider is enabled in Authentication settings
2. Verify your anon key is correct in `.env`
3. Clear browser cache and try again

### Issue: "Edge Function not working"
**Solution:**
```bash
# Check function logs
supabase functions logs process-statement

# Redeploy
supabase functions deploy process-statement --no-verify-jwt
```

---

## 🎉 Post-Migration

Once migration is complete:

1. **Update your team** with new credentials (if applicable)
2. **Delete old `.env` backup** (if you created one)
3. **Test all features** thoroughly
4. **Update documentation** with new project details
5. **Consider setting up backups** in Supabase Dashboard

---

## 📚 Useful Commands

```bash
# Check migration status
supabase db diff

# View remote database
supabase db remote

# Run migrations locally
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/integrations/supabase/types.ts

# View function logs
supabase functions logs process-statement --follow
```

---

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

---

## 💡 Tips

1. **Keep your database password safe** - Store it in a password manager
2. **Use environment variables** - Never commit credentials to Git
3. **Enable database backups** - Configure in Supabase Dashboard → Database → Backups
4. **Monitor usage** - Check Dashboard → Settings → Usage to stay within free tier limits
5. **Set up alerts** - Configure email alerts for quota limits

---

## ⚠️ Important Notes

- The free tier includes:
  - 500 MB database space
  - 1 GB file storage
  - 2 GB bandwidth
  - 500K Edge Function invocations
  
- If you need more, consider upgrading to Pro ($25/month)

- **Do not share** your service role key publicly (it's not in `.env` for security)

---

**Need help?** Check the [Supabase Discord](https://discord.supabase.com) or [GitHub Discussions](https://github.com/supabase/supabase/discussions)
