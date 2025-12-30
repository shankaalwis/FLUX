# Quick Migration Commands

## 🚀 Automated Migration (Recommended)
```powershell
# Run the automated migration script
.\migrate-backend.ps1
```

## 📝 Manual Migration Steps

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 4. Push Database Migrations
```bash
supabase db push
```

### 5. Deploy Edge Functions
```bash
supabase functions deploy process-statement
```

### 6. Start Development Server
```bash
npm run dev
```

## 🔧 Useful Commands

### Database
```bash
# View database status
supabase db diff

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Edge Functions
```bash
# List all functions
supabase functions list

# View function logs
supabase functions logs process-statement

# Test function locally
supabase functions serve process-statement
```

### Project Management
```bash
# Check project status
supabase status

# View project info
supabase projects list

# Unlink project
supabase unlink
```

## 📋 Environment Variables Template

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

## 🔗 Quick Links

- **Dashboard**: https://supabase.com/dashboard
- **Docs**: https://supabase.com/docs
- **CLI Reference**: https://supabase.com/docs/reference/cli
- **Discord**: https://discord.supabase.com

## ⚡ One-Line Migration (After Setup)

```bash
supabase link --project-ref YOUR_ID && supabase db push && supabase functions deploy process-statement
```

## 🆘 Troubleshooting

### Clear and Restart
```bash
supabase db reset
supabase db push
supabase functions deploy process-statement
npm run dev
```

### Check Logs
```bash
# Function logs
supabase functions logs process-statement --follow

# Database logs
supabase db logs
```

### Verify Connection
```bash
# Test database connection
supabase db remote

# Check project link
supabase projects list
```
