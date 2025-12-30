# 🎯 START HERE: Backend Migration to Your Personal Supabase

Welcome! This guide will help you migrate your Statement Insights backend from the existing Supabase project to your own personal Supabase project.

---

## 📚 Documentation Overview

I've created several guides to help you:

| File | Purpose | When to Use |
|------|---------|-------------|
| **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** | Overview & visual guide | Read this first! |
| **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** | Detailed step-by-step instructions | Follow for manual migration |
| **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** | Progress tracker | Use while migrating |
| **[QUICK_COMMANDS.md](./QUICK_COMMANDS.md)** | Command reference | Quick lookup |
| **migrate-backend.ps1** | Automated script | For quick migration |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create Your Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details and click **"Create"**
4. Wait ~2 minutes for provisioning
5. Copy your credentials:
   - Project ID
   - Project URL  
   - Anon Key

### Step 2: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 3: Run Migration
Choose one:

**Option A: Automated (Recommended)**
```powershell
.\migrate-backend.ps1
```

**Option B: Manual**
```bash
# Update .env with your new credentials first, then:
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
supabase functions deploy process-statement
```

---

## ✅ What You'll Get

After migration, your new Supabase project will have:

- ✅ **5 Database Tables** (bank_profiles, statements, transactions, ai_insights, transaction_audit_log)
- ✅ **Row Level Security** (RLS) policies for data protection
- ✅ **Storage Bucket** for PDF statements
- ✅ **Edge Function** for processing statements
- ✅ **Indexes** for optimal performance
- ✅ **Authentication** ready to use

---

## 📋 Before You Start

Make sure you have:
- [ ] A Supabase account (free tier is fine)
- [ ] Node.js and npm installed
- [ ] 20 minutes of time
- [ ] Your new Supabase project credentials

---

## 🎯 Recommended Path

1. **Read**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) (5 min)
2. **Prepare**: Create new Supabase project (5 min)
3. **Migrate**: Run `.\migrate-backend.ps1` (5 min)
4. **Test**: `npm run dev` and test features (5 min)
5. **Track**: Use [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)

---

## 🆘 Need Help?

### Common Issues

**"Supabase CLI not found"**
```bash
npm install -g supabase
```

**"Migration failed"**
```bash
supabase db reset
supabase db push
```

**"CORS errors"**
- Check your `.env` file has correct URL
- Clear browser cache

### Get Support
- 📖 Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) troubleshooting section
- 💬 Ask in [Supabase Discord](https://discord.supabase.com)
- 🐛 Search [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

---

## 🎉 After Migration

Test your app:
```bash
npm run dev
```

Then verify:
1. Sign up a new user
2. Create a bank profile
3. Upload a statement
4. View transactions

---

## 💡 Pro Tips

1. **Keep credentials safe** - Never commit `.env` to Git
2. **Use free tier** - Perfect for personal projects
3. **Enable backups** - In Supabase Dashboard → Database → Backups
4. **Monitor usage** - Dashboard → Settings → Usage

---

## 📊 Your Current Setup

**Old Project:**
- ID: `ztfsgljiqjzkkrajhnce`
- URL: `https://ztfsgljiqjzkkrajhnce.supabase.co`

**New Project:**
- ID: `(You'll get this after creating project)`
- URL: `(You'll get this after creating project)`

---

## ⏱️ Time Estimate

- **Quick Migration**: ~20 minutes
- **With Data Migration**: ~30-45 minutes
- **Testing**: ~10 minutes

**Total: About 30 minutes** ⏰

---

## 🔗 Quick Links

- [Create Supabase Project](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [CLI Reference](https://supabase.com/docs/reference/cli)

---

**Ready? Start with [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)!** 🚀
